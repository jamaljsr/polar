import { debug } from 'electron-log';
import { LightningNode, RgbLdkNode } from 'shared/types';
import * as PLN from 'lib/lightning/types';
import { LightningService } from 'types';
import { delay, waitFor } from 'utils/async';
import { httpGet, httpPost } from './rgbldkApi';

type StatusDto = {
  is_running: boolean;
  is_listening: boolean;
  best_block_height: number;
};
type NodeIdResponse = { node_id: string };
type BalancesDto = {
  total_onchain_balance_sats: number;
  spendable_onchain_balance_sats: number;
  total_anchor_channels_reserve_sats: number;
  total_lightning_balance_sats: number;
};
type PeerDetailsDto = {
  node_id: string;
  address: string;
  is_persisted: boolean;
  is_connected: boolean;
};
type ChannelDetailsExtendedDto = {
  channel_id: string;
  user_channel_id: string;
  counterparty_node_id: string;
  channel_point?: string | null;
  channel_value_sats: number;
  outbound_capacity_msat: number;
  inbound_capacity_msat: number;
  is_channel_ready: boolean;
  is_usable: boolean;
  is_announced: boolean;
};
type OpenChannelResponse = { user_channel_id: string };
type Bolt11ReceiveResponse = { invoice: string };
type Bolt11DecodeResponse = {
  payment_hash: string;
  destination: string;
  amount_msat?: number | null;
  expiry_secs: number;
};
type Bolt11PayResponse = {
  payment_id: string;
  preimage: string;
  amount_sats: number;
  destination: string;
  fee_paid_msat?: number | null;
};

type EventDto =
  | { type: 'ChannelPending'; data: { funding_txo: { txid: string; vout: number } } }
  | { type: 'ChannelReady'; data: { user_channel_id: string } }
  | { type: 'ChannelClosed'; data: Record<string, never> }
  | { type: string; data: any };

const txidFromChannelPoint = (channelPoint: string) => channelPoint.split(':')[0];

class RgbLdkService implements LightningService {
  private listeners = new Map<string, { stopped: boolean }>();

  async waitUntilOnline(
    node: LightningNode,
    interval = 3 * 1000,
    timeout = 120 * 1000,
  ): Promise<void> {
    return waitFor(async () => await this.getInfo(node), interval, timeout);
  }

  async getInfo(node: LightningNode): Promise<PLN.LightningNodeInfo> {
    const n = this.cast(node);
    const [{ node_id }, status, channels] = await Promise.all([
      httpGet<NodeIdResponse>(n, '/node_id'),
      httpGet<StatusDto>(n, '/status'),
      httpGet<ChannelDetailsExtendedDto[]>(n, '/channels'),
    ]);

    const pending = channels.filter(c => !c.is_channel_ready).length;
    const active = channels.filter(c => c.is_channel_ready).length;
    const inactive = 0;

    return {
      pubkey: node_id,
      alias: n.name,
      rpcUrl: `${node_id}@${n.name}:9735`,
      syncedToChain: status.is_running,
      blockHeight: status.best_block_height,
      numPendingChannels: pending,
      numActiveChannels: active,
      numInactiveChannels: inactive,
    };
  }

  async getBalances(node: LightningNode): Promise<PLN.LightningNodeBalances> {
    const n = this.cast(node);
    const b = await httpGet<BalancesDto>(n, '/balances');
    const total = b.total_onchain_balance_sats;
    const confirmed = b.spendable_onchain_balance_sats;
    const unconfirmed = Math.max(0, total - confirmed);
    return {
      total: total.toString(),
      confirmed: confirmed.toString(),
      unconfirmed: unconfirmed.toString(),
    };
  }

  async getNewAddress(node: LightningNode): Promise<PLN.LightningNodeAddress> {
    const n = this.cast(node);
    const res = await httpPost<{ address: string }>(n, '/wallet/new_address', {});
    return { address: res.address };
  }

  async getChannels(node: LightningNode): Promise<PLN.LightningNodeChannel[]> {
    const n = this.cast(node);
    const channels = await httpGet<ChannelDetailsExtendedDto[]>(n, '/channels');
    return channels.map(c => {
      const channelPoint = c.channel_point || '';
      const uniqueId = channelPoint
        ? txidFromChannelPoint(channelPoint).slice(-12)
        : c.channel_id.slice(-12);
      const status: PLN.LightningNodeChannel['status'] = c.is_channel_ready
        ? 'Open'
        : 'Opening';
      return {
        pending: !c.is_channel_ready,
        uniqueId,
        channelPoint,
        pubkey: c.counterparty_node_id,
        capacity: c.channel_value_sats.toString(),
        localBalance: Math.floor(c.outbound_capacity_msat / 1000).toString(),
        remoteBalance: Math.floor(c.inbound_capacity_msat / 1000).toString(),
        status,
        isPrivate: !c.is_announced,
        assets: [],
      };
    });
  }

  async getPeers(node: LightningNode): Promise<PLN.LightningNodePeer[]> {
    const n = this.cast(node);
    const peers = await httpGet<PeerDetailsDto[]>(n, '/peers');
    return peers.map(p => ({ pubkey: p.node_id, address: p.address }));
  }

  async connectPeers(node: LightningNode, rpcUrls: string[]): Promise<void> {
    const n = this.cast(node);
    for (const toRpcUrl of rpcUrls) {
      try {
        const [toPubKey, address] = toRpcUrl.split('@');
        if (!toPubKey || !address) continue;
        await httpPost(n, '/peers/connect', {
          node_id: toPubKey,
          address,
          persist: false,
        });
      } catch (error: any) {
        debug(
          `RgbLdkService: Failed to connect peer '${toRpcUrl}' for ${node.name}:`,
          error?.message || error,
        );
      }
    }
  }

  async openChannel({
    from,
    toRpcUrl,
    amount,
    isPrivate,
  }: {
    from: LightningNode;
    toRpcUrl: string;
    amount: string;
    isPrivate: boolean;
  }): Promise<PLN.LightningNodeChannelPoint> {
    const n = this.cast(from);

    const [toPubKey, address] = toRpcUrl.split('@');
    if (!toPubKey || !address) throw new Error(`Invalid rpcUrl: ${toRpcUrl}`);

    const res = await httpPost<OpenChannelResponse>(n, '/channel/open', {
      node_id: toPubKey,
      address,
      channel_amount_sats: parseInt(amount),
      announce: !isPrivate,
    });

    // Poll channels until the funding outpoint is known for this user_channel_id.
    // This avoids competing with the global event queue used for chart syncing.
    const channelPoint = await waitFor(
      async () => {
        const channels = await httpGet<ChannelDetailsExtendedDto[]>(n, '/channels');
        const chan = channels.find(
          c => c.user_channel_id === res.user_channel_id && !!c.channel_point,
        );
        if (!chan?.channel_point) throw new Error('waiting for funding outpoint');
        return chan.channel_point;
      },
      250,
      60 * 1000,
    );

    const [txid, voutStr] = channelPoint.split(':');
    const vout = parseInt(voutStr);
    debug(
      `RgbLdkService: openChannel user_channel_id=${res.user_channel_id} funding=${channelPoint}`,
    );
    return { txid, index: vout };
  }

  async closeChannel(node: LightningNode, channelPoint: string): Promise<any> {
    const n = this.cast(node);
    const channels = await httpGet<ChannelDetailsExtendedDto[]>(n, '/channels');
    const found = channels.find(c => (c.channel_point || '') === channelPoint);
    if (!found) throw new Error(`Channel not found: ${channelPoint}`);
    return await httpPost(n, '/channel/close', {
      user_channel_id: found.user_channel_id,
      counterparty_node_id: found.counterparty_node_id,
    });
  }

  async createInvoice(
    node: LightningNode,
    amount: number,
    memo?: string,
  ): Promise<string> {
    const n = this.cast(node);
    const res = await httpPost<Bolt11ReceiveResponse>(n, '/bolt11/receive', {
      amount_msat: amount * 1000,
      description: memo || `Payment to ${node.name}`,
      expiry_secs: 3600,
    });
    return res.invoice;
  }

  async payInvoice(
    node: LightningNode,
    invoice: string,
    amount?: number,
    customRecords?: PLN.CustomRecords,
  ): Promise<PLN.LightningNodePayReceipt> {
    if (customRecords && Object.keys(customRecords).length) {
      throw new Error('RgbLdkService: customRecords not supported for Bolt11 payments');
    }
    const n = this.cast(node);
    const res = await httpPost<Bolt11PayResponse>(n, '/bolt11/pay', {
      invoice,
      amount_msat: amount ? amount * 1000 : undefined,
    });
    return {
      preimage: res.preimage,
      amount: res.amount_sats,
      destination: res.destination,
    };
  }

  async decodeInvoice(
    node: LightningNode,
    invoice: string,
  ): Promise<PLN.LightningNodePaymentRequest> {
    const n = this.cast(node);
    const res = await httpPost<Bolt11DecodeResponse>(n, '/bolt11/decode', { invoice });
    return {
      paymentHash: res.payment_hash,
      amountMsat: (res.amount_msat || 0).toString(),
      expiry: res.expiry_secs.toString(),
    };
  }

  async addListenerToNode(node: LightningNode): Promise<void> {
    debug('RgbLdkService: addListenerToNode', node.name);
  }

  async removeListener(node: LightningNode): Promise<void> {
    const key = this.listenerKey(node);
    const state = this.listeners.get(key);
    if (state) state.stopped = true;
    this.listeners.delete(key);
  }

  async subscribeChannelEvents(
    node: LightningNode,
    callback: (event: PLN.LightningNodeChannelEvent) => void,
  ): Promise<void> {
    const n = this.cast(node);
    const key = this.listenerKey(n);
    if (this.listeners.has(key)) return;
    const state = { stopped: false };
    this.listeners.set(key, state);

    (async () => {
      debug(`RgbLdkService: [poll] ${n.name}: listening for channel events`);
      while (!state.stopped) {
        try {
          const evt = await httpPost<EventDto>(n, '/events/wait_next', {});
          await httpPost(n, '/events/handled', {});
          if (evt.type === 'ChannelPending') callback({ type: 'Pending' });
          else if (evt.type === 'ChannelReady') callback({ type: 'Open' });
          else if (evt.type === 'ChannelClosed') callback({ type: 'Closed' });
          else callback({ type: 'Unknown' });
        } catch (error: any) {
          debug(
            `RgbLdkService: [poll] ${n.name}: event loop error`,
            error?.message || error,
          );
          await delay(1000);
        }
      }
    })();
  }

  private listenerKey(node: LightningNode): string {
    return `${node.networkId}:${node.name}`;
  }

  private cast(node: LightningNode): RgbLdkNode {
    if (node.implementation !== 'rgbldk')
      throw new Error(`RgbLdkService cannot be used for '${node.implementation}' nodes`);
    return node as RgbLdkNode;
  }
}

export default new RgbLdkService();
