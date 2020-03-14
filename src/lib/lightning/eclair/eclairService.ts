import { debug } from 'electron-log';
import { BitcoinNode, EclairNode, LightningNode } from 'shared/types';
import { bitcoindService } from 'lib/bitcoin';
import { LightningService } from 'types';
import { waitFor } from 'utils/async';
import { toSats } from 'utils/units';
import * as PLN from '../types';
import { httpPost } from './eclairApi';
import * as ELN from './types';

const ChannelStateToStatus: Record<
  ELN.ChannelState,
  PLN.LightningNodeChannel['status']
> = {
  WAIT_FOR_INIT_INTERNAL: 'Opening',
  WAIT_FOR_OPEN_CHANNEL: 'Opening',
  WAIT_FOR_ACCEPT_CHANNEL: 'Opening',
  WAIT_FOR_FUNDING_INTERNAL: 'Opening',
  WAIT_FOR_FUNDING_CREATED: 'Opening',
  WAIT_FOR_FUNDING_SIGNED: 'Opening',
  WAIT_FOR_FUNDING_CONFIRMED: 'Opening',
  WAIT_FOR_FUNDING_LOCKED: 'Opening',
  NORMAL: 'Open',
  SHUTDOWN: 'Closed',
  NEGOTIATING: 'Opening',
  CLOSING: 'Closing',
  CLOSED: 'Closed',
  OFFLINE: 'Open',
  SYNCING: 'Open',
  WAIT_FOR_REMOTE_PUBLISH_FUTURE_COMMITMENT: 'Opening',
  ERR_FUNDING_LOST: 'Error',
  ERR_INFORMATION_LEAK: 'Error',
};

class EclairService implements LightningService {
  async getInfo(node: LightningNode): Promise<PLN.LightningNodeInfo> {
    const info = await httpPost<ELN.GetInfoResponse>(this.cast(node), 'getinfo');
    return {
      pubkey: info.nodeId,
      alias: info.alias,
      rpcUrl:
        info.publicAddresses && info.publicAddresses[0]
          ? `${info.nodeId}@${info.publicAddresses[0]}`
          : '',
      syncedToChain: true,
      blockHeight: info.blockHeight,
      numActiveChannels: 0,
      numPendingChannels: 0,
      numInactiveChannels: 0,
    };
  }

  async getBalances(
    node: LightningNode,
    backend?: BitcoinNode,
  ): Promise<PLN.LightningNodeBalances> {
    const btcNode = this.validateBackend('getNewAddress', backend);
    const balances = await bitcoindService.getWalletInfo(btcNode);
    const unconfirmed = balances.unconfirmed_balance + balances.immature_balance;
    return {
      total: toSats(balances.balance + unconfirmed),
      confirmed: toSats(balances.balance),
      unconfirmed: toSats(unconfirmed),
    };
  }
  async getNewAddress(node: LightningNode): Promise<PLN.LightningNodeAddress> {
    const address = await httpPost<string>(this.cast(node), 'getnewaddress');
    return { address };
  }

  async getChannels(node: LightningNode): Promise<PLN.LightningNodeChannel[]> {
    const channels = await httpPost<ELN.ChannelResponse[]>(this.cast(node), 'channels');
    return channels
      .filter(c => c.data.commitments.localParams.isFunder)
      .filter(c => ChannelStateToStatus[c.state] !== 'Closed')
      .map(c => {
        const status = ChannelStateToStatus[c.state] || 'Error';
        const { localCommit, commitInput } = c.data.commitments;
        return {
          pending: status !== 'Open',
          uniqueId: c.channelId.slice(-12),
          channelPoint: c.channelId,
          pubkey: c.nodeId,
          capacity: commitInput.amountSatoshis,
          localBalance: this.toSats(localCommit.spec.toLocal),
          remoteBalance: this.toSats(localCommit.spec.toRemote),
          status,
        };
      });
  }

  async getPeers(node: LightningNode): Promise<PLN.LightningNodePeer[]> {
    const peers = await httpPost<ELN.PeerResponse[]>(this.cast(node), 'peers');
    return peers.map(p => ({
      pubkey: p.nodeId,
      address: '',
    }));
  }

  async connectPeers(node: LightningNode, rpcUrls: string[]): Promise<void> {
    const peers = await this.getPeers(node);
    const keys = peers.map(p => p.pubkey);
    const newUrls = rpcUrls.filter(u => !keys.includes(u.split('@')[0]));
    for (const toRpcUrl of newUrls) {
      try {
        const body = { uri: toRpcUrl };
        await httpPost<{ uri: string }>(this.cast(node), 'connect', body);
      } catch (error) {
        debug(
          `Failed to connect peer '${toRpcUrl}' to Eclair node ${node.name}:`,
          error.message,
        );
      }
    }
  }

  async openChannel(
    from: LightningNode,
    toRpcUrl: string,
    amount: string,
  ): Promise<PLN.LightningNodeChannelPoint> {
    // get peers of source node
    const clnFrom = this.cast(from);

    // add peer if not connected already
    await this.connectPeers(clnFrom, [toRpcUrl]);
    // get pubkey of dest node
    const [toPubKey] = toRpcUrl.split('@');

    // open the channel
    const body: ELN.OpenChannelRequest = {
      nodeId: toPubKey,
      fundingSatoshis: parseInt(amount),
    };
    const res = await httpPost<string>(this.cast(from), 'open', body);

    return {
      txid: res,
      // Eclair doesn't return the output index. hard-code to 0
      index: 0,
    };
  }

  async closeChannel(node: LightningNode, channelPoint: string): Promise<any> {
    const body: ELN.CloseChannelRequest = {
      channelId: channelPoint,
    };
    return await httpPost<string>(this.cast(node), 'close', body);
  }

  async createInvoice(
    node: LightningNode,
    amount: number,
    memo?: string,
  ): Promise<string> {
    const body: ELN.CreateInvoiceRequest = {
      description: memo || `Payment to ${node.name}`,
      amountMsat: amount,
    };
    const inv = await httpPost<ELN.CreateInvoiceResponse>(
      this.cast(node),
      'createinvoice',
      body,
    );

    return inv.serialized;
  }

  async payInvoice(
    node: LightningNode,
    invoice: string,
    amount?: number,
  ): Promise<PLN.LightningNodePayReceipt> {
    const amountMsat = amount ? amount * 1000 : undefined;
    const body: ELN.PayInvoiceRequest = { invoice, amountMsat };
    const id = await httpPost<string>(this.cast(node), 'payinvoice', body);

    // payinvoice is fire-and-forget, so we need to poll to check for status updates.
    // poll for a success every second for up to 5 seconds
    await waitFor(() => this.getPaymentStatus(node, id), 1000, 5 * 1000);

    const { status, paymentRequest } = await this.getPaymentStatus(node, id);
    return {
      preimage: status.paymentPreimage,
      amount: paymentRequest.amount,
      destination: paymentRequest.nodeId,
    };
  }

  async getPaymentStatus(
    node: LightningNode,
    id: string,
  ): Promise<ELN.GetSentInfoResponse> {
    const body: ELN.GetSentInfoRequest = { id };
    const attempts = await httpPost<ELN.GetSentInfoResponse[]>(
      this.cast(node),
      'getsentinfo',
      body,
    );
    const sent = attempts.find(a => a.status.type === 'sent');
    if (!sent) {
      // throw an error with the failureMessage
      let msg = 'Failed to send payment';
      const failed = attempts.find(a => a.status.type === 'failed');
      if (failed) {
        const { failures } = failed.status;
        if (failures.length) {
          msg = failures[0].failureMessage;
        }
      }
      throw new Error(msg);
    }

    return sent;
  }

  /**
   * Helper function to continually query the LND node until a successful
   * response is received or it times out
   */
  async waitUntilOnline(
    node: LightningNode,
    interval = 3 * 1000, // check every 3 seconds
    timeout = 60 * 1000, // timeout after 60 seconds
  ): Promise<void> {
    return waitFor(
      async () => {
        await this.getInfo(node);
      },
      interval,
      timeout,
    );
  }

  private cast(node: LightningNode): EclairNode {
    if (node.implementation !== 'eclair')
      throw new Error(`EclairService cannot be used for '${node.implementation}' nodes`);

    return node as EclairNode;
  }

  private toSats(msats: number): string {
    return (msats / 1000).toFixed(0).toString();
  }

  private validateBackend(action: string, backend?: BitcoinNode) {
    if (!backend) throw new Error(`EclairService ${action}: backend was not specified`);

    return backend as BitcoinNode;
  }
}

export default new EclairService();
