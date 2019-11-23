import * as LND from '@radar/lnrpc';
import { LightningNode, LndNode } from 'shared/types';
import {
  LightningNodeAddress,
  LightningNodeBalances,
  LightningNodeChannel,
  LightningNodeChannelPoint,
  LightningNodeInfo,
} from 'lib/lightning/types';
import { LndLibrary } from 'types';
import { waitFor } from 'utils/async';
import { getContainerName } from 'utils/network';
import { lndProxyClient as proxy } from './';
import { mapOpenChannel, mapPendingChannel } from './mappers';

class LndService implements LndLibrary {
  async getInfo(node: LightningNode): Promise<LightningNodeInfo> {
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

  async getBalances(node: LightningNode): Promise<LightningNodeBalances> {
    const balances = await proxy.getWalletBalance(this.cast(node));
    return {
      total: balances.totalBalance,
      confirmed: balances.confirmedBalance,
      unconfirmed: balances.unconfirmedBalance,
    };
  }

  async getNewAddress(node: LightningNode): Promise<LightningNodeAddress> {
    return await proxy.getNewAddress(this.cast(node));
  }

  async getChannels(node: LightningNode): Promise<LightningNodeChannel[]> {
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

  async openChannel(
    from: LightningNode,
    to: LightningNode,
    amount: string,
  ): Promise<LightningNodeChannelPoint> {
    // get pubkey of dest node
    const { pubkey: toPubKey } = await this.getInfo(to);
    const lndFrom = this.cast(from);

    // get peers of source node
    const { peers } = await proxy.listPeers(lndFrom);
    // check if already connected
    const peer = peers.find(p => p.pubKey === toPubKey);

    // add peer if not connected
    if (!peer) {
      const addr: LND.LightningAddress = {
        pubkey: toPubKey,
        host: getContainerName(to),
      };
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

  async listChannels(node: LndNode): Promise<LND.ListChannelsResponse> {
    return await proxy.listChannels(node, {});
  }

  async pendingChannels(node: LndNode): Promise<LND.PendingChannelsResponse> {
    return await proxy.pendingChannels(node);
  }

  async onNodesDeleted(nodes: LndNode[]): Promise<void> {
    return await proxy.onNodesDeleted(nodes);
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
