import { debug } from 'electron-log';
import { LightningNode, LdkServerNode, OpenChannelOptions } from 'shared/types';
import * as PLN from 'lib/lightning/types';
import { LightningService } from 'types';
import { waitFor } from 'utils/async';
import ldkProxyClient from './ldkProxyClient';
import { mapChannel, mapChannelEvent } from './mappers';
import { LdkBalances, LdkChannel, LdkNodeInfo, LdkPayment } from './types';

class LdkServerService implements LightningService {
  async waitUntilOnline(node: LightningNode): Promise<void> {
    return waitFor(
      async () => {
        const info = (await ldkProxyClient.getInfo(this.cast(node))) as LdkNodeInfo;
        if (!info.current_best_block?.height) {
          throw new Error('LDK Server node is not synced yet');
        }
      },
      3 * 1000,
      120 * 1000,
    );
  }

  async getInfo(node: LightningNode): Promise<PLN.LightningNodeInfo> {
    const ldkNode = this.cast(node);
    const [info, channelsRes] = await Promise.all([
      ldkProxyClient.getInfo(ldkNode) as Promise<LdkNodeInfo>,
      ldkProxyClient.listChannels(ldkNode) as Promise<{ channels?: LdkChannel[] }>,
    ]);
    const channels = (channelsRes.channels || []) as LdkChannel[];
    const numActiveChannels = channels.filter(
      c => c.is_channel_ready && c.is_usable,
    ).length;
    const numPendingChannels = channels.filter(c => !c.is_channel_ready).length;
    const numInactiveChannels = channels.filter(
      c => c.is_channel_ready && !c.is_usable,
    ).length;
    return {
      pubkey: info.node_id,
      alias: info.node_alias || node.name,
      rpcUrl: info.node_uris?.[0] || `${info.node_id}@${node.name}:9735`,
      syncedToChain: !!info.current_best_block?.height,
      blockHeight: info.current_best_block?.height || 0,
      numActiveChannels,
      numPendingChannels,
      numInactiveChannels,
    };
  }

  async getBalances(node: LightningNode): Promise<PLN.LightningNodeBalances> {
    const balances = (await ldkProxyClient.getBalances(this.cast(node))) as LdkBalances;
    const total =
      Number(balances.total_onchain_balance_sats || 0) +
      Number(balances.total_lightning_balance_sats || 0);
    const confirmed = Number(balances.spendable_onchain_balance_sats || 0);
    return {
      total: String(total),
      confirmed: String(confirmed),
      unconfirmed: String(Math.max(0, total - confirmed)),
    };
  }

  async getNewAddress(node: LightningNode): Promise<PLN.LightningNodeAddress> {
    const res = (await ldkProxyClient.onchainReceive(this.cast(node))) as {
      address: string;
    };
    return { address: res.address };
  }

  async getChannels(node: LightningNode): Promise<PLN.LightningNodeChannel[]> {
    const res = (await ldkProxyClient.listChannels(this.cast(node))) as {
      channels?: LdkChannel[];
    };
    const channels = (res.channels || []) as LdkChannel[];
    return channels.map(mapChannel);
  }

  async getPeers(node: LightningNode): Promise<PLN.LightningNodePeer[]> {
    const res = (await ldkProxyClient.listPeers(this.cast(node))) as {
      peers?: Array<{ node_id: string; address: string }>;
    };
    return (res.peers || []).map((p: any) => ({
      pubkey: p.node_id,
      address: p.address,
    }));
  }

  async connectPeers(node: LightningNode, rpcUrls: string[]): Promise<void> {
    const peers = await this.getPeers(node);
    const keys = peers.map(p => p.pubkey);
    const newUrls = rpcUrls.filter(u => !keys.includes(u.split('@')[0]));
    for (const toRpcUrl of newUrls) {
      try {
        const [toPubKey, host] = toRpcUrl.split('@');
        await ldkProxyClient.connectPeer(this.cast(node), {
          node_pubkey: toPubKey,
          address: host,
          persist: true,
        });
      } catch (error: any) {
        debug(
          `Failed to connect peer '${toRpcUrl}' to LDK Server node ${node.name}:`,
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
    const ldkFrom = this.cast(from);
    await this.connectPeers(ldkFrom, [toRpcUrl]);
    const [toPubKey, host] = toRpcUrl.split('@');
    await ldkProxyClient.openChannel(ldkFrom, {
      node_pubkey: toPubKey,
      address: host,
      channel_amount_sats: amount,
      announce_channel: !isPrivate,
    });
    // ldk-server does not return a funding outpoint synchronously on open-channel.
    // callers should refresh channels and resolve by counterparty/user_channel_id later.
    return { txid: '', index: 0 };
  }

  async closeChannel(node: LightningNode, channelPoint: string): Promise<any> {
    const channels = await this.getChannels(node);
    const channel = channels.find(c => c.channelPoint === channelPoint);
    if (!channel) {
      throw new Error(`Channel not found for channel point ${channelPoint}`);
    }
    return ldkProxyClient.closeChannel(this.cast(node), {
      user_channel_id: channel.uniqueId,
      counterparty_node_id: channel.pubkey,
    });
  }

  async createInvoice(
    node: LightningNode,
    amount: number,
    memo?: string,
    expiry?: number,
  ): Promise<string> {
    const req: any = {
      amount_msat: amount * 1000,
      expiry_secs: expiry || 3600,
    };
    if (memo) {
      req.description = { direct: memo };
    }
    const res = (await ldkProxyClient.bolt11Receive(this.cast(node), req)) as {
      invoice: string;
    };
    return res.invoice;
  }

  async payInvoice(
    node: LightningNode,
    invoice: string,
    amount?: number,
  ): Promise<PLN.LightningNodePayReceipt> {
    const decoded = (await ldkProxyClient.decodeInvoice(this.cast(node), {
      invoice,
    })) as { amount_msat?: string; destination: string };
    const req: any = { invoice };
    if (amount && !decoded.amount_msat) {
      req.amount_msat = amount * 1000;
    }
    const sendRes = (await ldkProxyClient.bolt11Send(this.cast(node), req)) as {
      payment_id: string;
    };
    const payment = await this.waitForPayment(node, sendRes.payment_id);
    const preimage = payment?.kind?.bolt11?.preimage || '';
    return {
      amount: decoded.amount_msat
        ? Math.floor(Number(decoded.amount_msat) / 1000)
        : amount || 0,
      preimage,
      destination: decoded.destination,
    };
  }

  async decodeInvoice(
    node: LightningNode,
    invoice: string,
  ): Promise<PLN.LightningNodePaymentRequest> {
    const res = (await ldkProxyClient.decodeInvoice(this.cast(node), { invoice })) as {
      payment_hash: string;
      amount_msat?: string;
      expiry?: number;
    };
    return {
      paymentHash: res.payment_hash,
      amountMsat: res.amount_msat || '0',
      expiry: String(res.expiry || 0),
    };
  }

  async addListenerToNode(node: LightningNode): Promise<void> {
    await this.subscribeChannelEvents(node, () => undefined);
  }

  async removeListener(node: LightningNode): Promise<void> {
    ldkProxyClient.unsubscribeEvents(this.cast(node));
  }

  async subscribeChannelEvents(
    node: LightningNode,
    callback: (event: PLN.LightningNodeChannelEvent) => void,
  ): Promise<void> {
    await ldkProxyClient.subscribeEvents(this.cast(node), (data: any) => {
      const mapped = mapChannelEvent(data);
      if (mapped) {
        callback(mapped);
      }
    });
  }

  private async waitForPayment(
    node: LightningNode,
    paymentId: string,
  ): Promise<LdkPayment | undefined> {
    let payment: LdkPayment | undefined;
    await waitFor(
      async () => {
        const res = await ldkProxyClient.getPaymentDetails(this.cast(node), {
          payment_id: paymentId,
        });
        payment = (res as { payment?: LdkPayment }).payment;
        if (!payment) {
          throw new Error('Payment not found yet');
        }
        if (payment.status === 'FAILED') {
          throw new Error('Payment failed');
        }
        if (payment.status !== 'SUCCEEDED') {
          throw new Error(`Payment status is ${payment.status}`);
        }
        return payment;
      },
      1000,
      60000,
    );
    return payment;
  }

  private cast(node: LightningNode): LdkServerNode {
    if (node.implementation !== 'ldk-server') {
      throw new Error(
        `LdkServerService cannot be used for '${node.implementation}' nodes`,
      );
    }
    return node as LdkServerNode;
  }
}

export default new LdkServerService();
