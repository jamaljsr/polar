import * as LND from '@radar/lnrpc';
import { LightningNode, LndNode } from 'shared/types';
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

    const pluckChan = (c: any) => c.channel as LND.PendingChannel;
    // merge all of the channel types into one array
    return [
      ...open.filter(c => c.initiator).map(mapOpenChannel),
      ...opening.map(pluckChan).map(mapPendingChannel('Opening')),
      ...closing.map(pluckChan).map(mapPendingChannel('Closing')),
      ...forceClosing.map(pluckChan).map(mapPendingChannel('Force Closing')),
      ...waitingClose.map(pluckChan).map(mapPendingChannel('Waiting to Close')),
    ];
  }

  async getPeers(node: LightningNode): Promise<PLN.LightningNodePeer[]> {
    const { peers } = await proxy.listPeers(this.cast(node));
    return peers.map(p => ({
      pubkey: p.pubKey,
      address: p.address,
    }));
  }

  async openChannel(
    from: LightningNode,
    toRpcUrl: string,
    amount: string,
  ): Promise<PLN.LightningNodeChannelPoint> {
    // get peers of source node
    const lndFrom = this.cast(from);
    const peers = await this.getPeers(lndFrom);

    // get pubkey of dest node
    const [toPubKey, host] = toRpcUrl.split('@');
    // add peer if not connected
    if (!peers.some(p => p.pubkey === toPubKey)) {
      const addr: LND.LightningAddress = { pubkey: toPubKey, host };
      await proxy.connectPeer(lndFrom, { addr });
    }

    // open channel
    const req: LND.OpenChannelRequest = {
      nodePubkeyString: toPubKey,
      localFundingAmount: amount,
    };
    const res = await proxy.openChannel(lndFrom, req);
    return {
      txid: res.fundingTxidStr as string,
      index: res.outputIndex,
    };
  }

  async closeChannel(node: LightningNode, channelPoint: string): Promise<any> {
    const [txid, txindex] = channelPoint.split(':');
    const req: LND.CloseChannelRequest = {
      channelPoint: {
        fundingTxidBytes: Buffer.from(txid),
        fundingTxidStr: txid,
        outputIndex: parseInt(txindex),
      },
    };
    return await proxy.closeChannel(this.cast(node), req);
  }

  /**
   * Helper function to continually query the LND node until a successful
   * response is received or it times out
   */
  async waitUntilOnline(
    node: LightningNode,
    interval = 3 * 1000, // check every 3 seconds
    timeout = 30 * 1000, // timeout after 30 seconds
  ): Promise<void> {
    return waitFor(
      async () => {
        await this.getInfo(node);
      },
      interval,
      timeout,
    );
  }

  private cast(node: LightningNode): LndNode {
    if (node.implementation !== 'LND')
      throw new Error(`LndService cannot be used for '${node.implementation}' nodes`);

    return node as LndNode;
  }
}

export default new LndService();
