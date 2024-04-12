import { debug } from 'electron-log';
import { CLightningNode, LightningNode, OpenChannelOptions } from 'shared/types';
import * as PLN from 'lib/lightning/types';
import { LightningService } from 'types';
import { waitFor } from 'utils/async';
import { httpDelete, httpGet, httpPost } from './clightningApi';
import * as CLN from './types';

const ChannelStateToStatus: Record<CLN.ChannelState, PLN.LightningNodeChannel['status']> =
  {
    CHANNELD_AWAITING_LOCKIN: 'Opening',
    CHANNELD_NORMAL: 'Open',
    CHANNELD_SHUTTING_DOWN: 'Closing',
    CLOSINGD_SIGEXCHANGE: 'Closing',
    CLOSINGD_COMPLETE: 'Waiting to Close',
    AWAITING_UNILATERAL: 'Force Closing',
    FUNDING_SPEND_SEEN: 'Waiting to Close',
    ONCHAIN: 'Closed',
    CLOSED: 'Closed',
  };

class CLightningService implements LightningService {
  channelsInterval: NodeJS.Timeout | null = null;

  async getInfo(node: LightningNode): Promise<PLN.LightningNodeInfo> {
    const info = await httpGet<CLN.GetInfoResponse>(node, 'getinfo');
    return {
      pubkey: info.id,
      alias: info.alias,
      rpcUrl: info.binding
        .filter(b => b.type === 'ipv4')
        .reduce((v, b) => `${info.id}@${node.name}:${b.port}`, ''),
      syncedToChain: !info.warningBitcoindSync && !info.warningLightningdSync,
      blockHeight: info.blockheight,
      numActiveChannels: info.numActiveChannels,
      numPendingChannels: info.numPendingChannels,
      numInactiveChannels: info.numInactiveChannels,
    };
  }

  async getBalances(node: LightningNode): Promise<PLN.LightningNodeBalances> {
    const balances = await httpGet<CLN.GetBalanceResponse>(node, 'getBalance');
    return {
      total: balances.totalBalance.toString(),
      confirmed: balances.confBalance.toString(),
      unconfirmed: balances.unconfBalance.toString(),
    };
  }

  async getNewAddress(node: LightningNode): Promise<PLN.LightningNodeAddress> {
    return await httpGet<PLN.LightningNodeAddress>(node, 'newaddr');
  }

  async getChannels(node: LightningNode): Promise<PLN.LightningNodeChannel[]> {
    const { pubkey } = await this.getInfo(node);
    const channels = await httpGet<CLN.GetChannelsResponse[]>(
      node,
      'channel/listChannels',
    );
    return (
      channels
        // only include the channels that were initiated by this node
        .filter(
          chan =>
            chan.opener === 'local' ||
            // the fields below were deprecated in v0.12.0
            (chan.fundingAllocationMsat && chan.fundingAllocationMsat[pubkey] > 0),
        )
        .filter(c => ChannelStateToStatus[c.state] !== 'Closed')
        .map(c => {
          const status = ChannelStateToStatus[c.state];
          return {
            pending: status !== 'Open',
            uniqueId: c.fundingTxid ? c.fundingTxid.slice(-12) : '',
            channelPoint: c.channelId,
            pubkey: c.id,
            capacity: this.toSats(c.msatoshiTotal),
            localBalance: this.toSats(c.msatoshiToUs),
            remoteBalance: this.toSats(c.msatoshiTotal - c.msatoshiToUs),
            status,
            isPrivate: c.private,
          };
        })
    );
  }

  async getPeers(node: LightningNode): Promise<PLN.LightningNodePeer[]> {
    const peers = await httpGet<CLN.Peer[]>(node, 'peer/listPeers');
    return peers
      .filter(p => p.connected)
      .map(p => ({
        pubkey: p.id,
        address: (p.netaddr && p.netaddr[0]) || '',
      }));
  }

  async connectPeers(node: LightningNode, rpcUrls: string[]): Promise<void> {
    const peers = await this.getPeers(node);
    const keys = peers.map(p => p.pubkey);
    const newUrls = rpcUrls.filter(u => !keys.includes(u.split('@')[0]));
    for (const toRpcUrl of newUrls) {
      try {
        const body = { id: toRpcUrl };
        await httpPost<{ id: string }>(node, 'peer/connect', body);
      } catch (error: any) {
        debug(
          `Failed to connect peer '${toRpcUrl}' to c-lightning node ${node.name}:`,
          error.message,
        );
      }
    }
  }

  async openChannel({
    from,
    toRpcUrl,
    amount,
    isPrivate,
  }: OpenChannelOptions): Promise<PLN.LightningNodeChannelPoint> {
    // add peer if not connected already
    await this.connectPeers(from, [toRpcUrl]);
    // get pubkey of dest node
    const [toPubKey] = toRpcUrl.split('@');

    // open the channel
    const body: CLN.OpenChannelRequest = {
      id: toPubKey,
      satoshis: amount,
      feeRate: '253perkw', // min relay fee for bitcoind
      announce: isPrivate ? 'false' : 'true',
    };
    const res = await httpPost<CLN.OpenChannelResponse>(
      from,
      'channel/openChannel',
      body,
    );

    return {
      txid: res.txid,
      // c-lightning doesn't return the output index. hard-code to 0
      index: 0,
    };
  }

  async closeChannel(node: LightningNode, channelPoint: string): Promise<any> {
    return await httpDelete<CLN.CloseChannelResponse>(
      node,
      `channel/closeChannel/${channelPoint}`,
    );
  }

  async createInvoice(
    node: LightningNode,
    amount: number,
    memo?: string,
  ): Promise<string> {
    const body: CLN.InvoiceRequest = {
      amount: amount * 1000,
      label: new Date().getTime().toString(),
      description: memo || `Polar Invoice for ${node.name}`,
    };

    const res = await httpPost<CLN.InvoiceResponse>(node, 'invoice/genInvoice', body);

    return res.bolt11;
  }

  async payInvoice(
    node: LightningNode,
    invoice: string,
    amount?: number,
  ): Promise<PLN.LightningNodePayReceipt> {
    const body: CLN.PayRequest = { invoice, amount };

    const res = await httpPost<CLN.PayResponse>(node, 'pay', body);

    return {
      preimage: res.paymentPreimage,
      amount: res.msatoshi / 1000,
      destination: res.destination,
    };
  }

  /**
   * Helper function to continually query the node until a successful
   * response is received or it times out
   */
  async waitUntilOnline(
    node: LightningNode,
    interval = 3 * 1000, // check every 3 seconds
    timeout = 120 * 1000, // timeout after 120 seconds
  ): Promise<void> {
    return waitFor(
      async () => {
        await this.getInfo(node);
      },
      interval,
      timeout,
    );
  }

  async addListenerToNode(node: LightningNode): Promise<void> {
    console.log('addListenerToNode CLN on port: ', node.ports.rest);
  }

  private channelCaches: {
    [nodePort: number]: {
      intervalId: NodeJS.Timeout;
      channels: { pending: boolean; status: string }[];
    };
  } = {};

  async removeListener(node: LightningNode): Promise<void> {
    const nodePort = this.getNodePort(node);
    const cache = this.channelCaches[nodePort];
    if (cache) {
      clearInterval(cache.intervalId);
      delete this.channelCaches[nodePort];
    }
  }

  async subscribeChannelEvents(
    node: LightningNode,
    callback: (event: PLN.LightningNodeChannelEvent) => void,
  ): Promise<void> {
    const nodePort = this.getNodePort(node);
    if (!this.channelCaches[nodePort]) {
      // check c-lightning channels every 30 seconds
      this.channelCaches[nodePort] = {
        intervalId: setInterval(() => {
          this.checkChannels(node, callback);
        }, 30 * 1000),
        channels: [],
      };
    }
  }

  checkChannels = async (
    node: LightningNode,
    callback: (event: PLN.LightningNodeChannelEvent) => void,
  ) => {
    const result = await httpGet<CLN.GetChannelsResponse[]>(node, 'channel/listChannels');
    const channels = result.map(c => {
      const status = ChannelStateToStatus[c.state];
      return { pending: status !== 'Open', status };
    });

    const cache = this.channelCaches[this.getNodePort(node)];

    if (!this.areChannelsEqual(cache.channels, channels)) {
      this.handleUpdatedChannels(channels, callback);
      cache.channels = channels;
      // edge case for empty channels but cache channels is not empty
      if (!channels.length) {
        callback({ type: 'Closed' });
      }
    }
  };

  private handleUpdatedChannels = (
    channels: { pending: boolean; status: string }[],
    callback: (event: PLN.LightningNodeChannelEvent) => void,
  ) => {
    channels.forEach(channel => {
      if (channel.pending) {
        callback({ type: 'Pending' });
      } else if (channel.status === 'Open') {
        callback({ type: 'Open' });
      } else if (channel.status === 'Closed') {
        callback({ type: 'Closed' });
      }
    });
  };

  private toSats(msats: number): string {
    return (msats / 1000).toFixed(0).toString();
  }

  private areChannelsEqual(
    channels1: { pending: boolean; status: string }[],
    channels2: { pending: boolean; status: string }[],
  ): boolean {
    return (
      channels1.length === channels2.length &&
      JSON.stringify(channels1) === JSON.stringify(channels2)
    );
  }

  private getNodePort(node: LightningNode): number {
    if (node.implementation !== 'c-lightning')
      throw new Error(
        `ClightningService cannot be used for '${node.implementation}' nodes`,
      );
    return (node as CLightningNode).ports.rest;
  }
}

export default new CLightningService();
