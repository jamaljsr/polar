import { debug } from 'electron-log';
import * as LND from '@lightningpolar/lnd-api';
import { PendingChannel } from 'shared/lndDefaults';
import { LightningNode, LndNode, OpenChannelOptions } from 'shared/types';
import * as PLN from 'lib/lightning/types';
import { LightningService } from 'types';
import { waitFor } from 'utils/async';
import { lndProxyClient as proxy } from './';
import { mapOpenChannel, mapPendingChannel } from './mappers';

class LndService implements LightningService {
  async getInfo(node: LightningNode): Promise<PLN.LightningNodeInfo> {
    const info = await proxy.getInfo(this.cast(node));
    return {
      pubkey: info.identityPubkey,
      alias: info.alias,
      rpcUrl: (info.uris && info.uris[0]) || '',
      syncedToChain: info.syncedToChain,
      blockHeight: info.blockHeight,
      numActiveChannels: info.numActiveChannels,
      numPendingChannels: info.numPendingChannels,
      numInactiveChannels: info.numInactiveChannels,
    };
  }

  async getBalances(node: LightningNode): Promise<PLN.LightningNodeBalances> {
    const balances = await proxy.getWalletBalance(this.cast(node));
    return {
      total: balances.totalBalance,
      confirmed: balances.confirmedBalance,
      unconfirmed: balances.unconfirmedBalance,
    };
  }

  async getNewAddress(node: LightningNode): Promise<PLN.LightningNodeAddress> {
    return await proxy.getNewAddress(this.cast(node));
  }

  async getChannels(node: LightningNode): Promise<PLN.LightningNodeChannel[]> {
    const { channels: open } = await proxy.listChannels(this.cast(node), {});
    const {
      pendingOpenChannels: opening,
      pendingClosingChannels: closing,
      pendingForceClosingChannels: forceClosing,
      waitingCloseChannels: waitingClose,
    } = await proxy.pendingChannels(this.cast(node));

    const pluckChan = (c: any) => c.channel as PendingChannel;
    const isChanInitiatorLocal = (c: PendingChannel) =>
      c.initiator === LND.Initiator.INITIATOR_LOCAL;
    // merge all of the channel types into one array
    return [
      ...open.filter(c => c.initiator).map(mapOpenChannel),
      ...opening
        .map(pluckChan)
        .filter(isChanInitiatorLocal)
        .map(mapPendingChannel('Opening')),
      ...closing
        .map(pluckChan)
        .filter(isChanInitiatorLocal)
        .map(mapPendingChannel('Closing')),
      ...forceClosing
        .map(pluckChan)
        .filter(isChanInitiatorLocal)
        .map(mapPendingChannel('Force Closing')),
      ...waitingClose
        .map(pluckChan)
        .filter(isChanInitiatorLocal)
        .map(mapPendingChannel('Waiting to Close')),
    ];
  }

  async getPeers(node: LightningNode): Promise<PLN.LightningNodePeer[]> {
    const { peers } = await proxy.listPeers(this.cast(node));
    return peers.map(p => ({
      pubkey: p.pubKey,
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
        const addr: LND.LightningAddress = { pubkey: toPubKey, host };
        await proxy.connectPeer(this.cast(node), { addr });
      } catch (error: any) {
        debug(
          `Failed to connect peer '${toRpcUrl}' to LND node ${node.name}:`,
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
    const lndFrom = this.cast(from);

    // add peer if not connected already
    await this.connectPeers(lndFrom, [toRpcUrl]);
    // get pubkey of dest node
    const [toPubKey] = toRpcUrl.split('@');

    // open channel
    const req: LND.OpenChannelRequestPartial = {
      nodePubkeyString: toPubKey,
      localFundingAmount: amount,
      private: isPrivate,
    };
    const res = await proxy.openChannel(lndFrom, req);
    return {
      txid: res.fundingTxidStr as string,
      index: res.outputIndex,
    };
  }

  async closeChannel(node: LightningNode, channelPoint: string): Promise<any> {
    const [txid, txindex] = channelPoint.split(':');
    const req: LND.CloseChannelRequestPartial = {
      channelPoint: {
        fundingTxidBytes: Buffer.from(txid),
        fundingTxidStr: txid,
        outputIndex: parseInt(txindex),
      },
    };
    return await proxy.closeChannel(this.cast(node), req);
  }

  async createInvoice(
    node: LightningNode,
    amount: number,
    memo?: string,
    hopHint?: {
      nodeId: string;
      chanId: string;
      msats: string;
    },
  ): Promise<string> {
    const req: LND.InvoicePartial = {
      value: amount.toString(),
      memo,
    };
    // hop hints are used for creating TAP invoices
    if (hopHint) {
      req.value = undefined;
      req.valueMsat = hopHint.msats;
      req.routeHints = [
        { hopHints: [{ nodeId: hopHint.nodeId, chanId: hopHint.chanId }] },
      ];
    }
    const res = await proxy.createInvoice(this.cast(node), req);
    return res.paymentRequest;
  }

  async payInvoice(
    node: LightningNode,
    invoice: string,
    amount?: number,
    customRecords?: PLN.CustomRecords,
  ): Promise<PLN.LightningNodePayReceipt> {
    const req: LND.SendPaymentRequestPartial = {
      paymentRequest: invoice,
      amt: amount ? amount.toString() : undefined,
      feeLimitSat: amount ? Math.floor(amount * 0.02) : '1000',
      firstHopCustomRecords: customRecords,
    };
    const res = await proxy.payInvoice(this.cast(node), req);

    // decode the invoice to get additional information to return
    const payReq = await proxy.decodeInvoice(this.cast(node), { payReq: invoice });

    return {
      amount: parseInt(payReq.numSatoshis),
      preimage: res.paymentPreimage.toString(),
      destination: payReq.destination,
    };
  }

  async decodeInvoice(
    node: LightningNode,
    invoice: string,
  ): Promise<PLN.LightningNodePaymentRequest> {
    const res = await proxy.decodeInvoice(this.cast(node), { payReq: invoice });
    return {
      paymentHash: res.paymentHash,
      amountMsat: res.numMsat,
      expiry: res.expiry,
    };
  }

  /**
   * Helper function to continually query the LND node until a successful
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
    debug('addListenerToNode LndNode on port: ', node.ports.rest);
  }

  async subscribeChannelEvents(
    node: LightningNode,
    callback: (event: PLN.LightningNodeChannelEvent) => void,
  ): Promise<void> {
    debug(`LndService: [stream] ${node.name}: Listening for channel events`);
    const cb = (data: LND.ChannelEventUpdate) => {
      debug(`LndService: [stream] ${node.name}`, data);
      if (data.pendingOpenChannel) {
        callback({ type: 'Pending' });
      } else if (data.activeChannel?.fundingTxidBytes) {
        callback({ type: 'Open' });
      } else if (data.inactiveChannel?.fundingTxidBytes || data.closedChannel) {
        callback({ type: 'Closed' });
      }
    };
    await proxy.subscribeChannelEvents(this.cast(node), cb);
  }

  async removeListener(node: LightningNode): Promise<void> {
    debug('removeListener LndNode on port: ', node.ports.rest);
  }

  private cast(node: LightningNode): LndNode {
    if (node.implementation !== 'LND' && node.implementation !== 'litd')
      throw new Error(`LndService cannot be used for '${node.implementation}' nodes`);

    return node as LndNode;
  }
}

export default new LndService();
