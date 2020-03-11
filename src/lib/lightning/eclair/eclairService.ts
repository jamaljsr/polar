/* eslint-disable @typescript-eslint/no-unused-vars */
import { EclairNode, LightningNode } from 'shared/types';
import { LightningService } from 'types';
import { waitFor } from 'utils/async';
import * as PLN from '../types';
import { httpPost } from './eclairApi';
import * as ELN from './types';

class EclairService implements LightningService {
  async getInfo(node: LightningNode): Promise<PLN.LightningNodeInfo> {
    const info = await httpPost<ELN.GetInfoResponse>(this.cast(node), 'getinfo');
    return {
      pubkey: info.nodeId,
      alias: info.alias,
      rpcUrl: (info.publicAddresses && info.publicAddresses[0]) || '',
      syncedToChain: true,
      blockHeight: info.blockHeight,
      numActiveChannels: 0,
      numPendingChannels: 0,
      numInactiveChannels: 0,
    };
  }
  getBalances(node: LightningNode): Promise<PLN.LightningNodeBalances> {
    throw new Error(`getBalances is not implemented for ${node.implementation} nodes`);
  }
  getNewAddress(node: LightningNode): Promise<PLN.LightningNodeAddress> {
    throw new Error(`getNewAddress is not implemented for ${node.implementation} nodes`);
  }
  getChannels(node: LightningNode): Promise<PLN.LightningNodeChannel[]> {
    throw new Error(`getChannels is not implemented for ${node.implementation} nodes`);
  }
  getPeers(node: LightningNode): Promise<PLN.LightningNodePeer[]> {
    throw new Error(`getPeers is not implemented for ${node.implementation} nodes`);
  }
  connectPeers(node: LightningNode, rpcUrls: string[]): Promise<void> {
    throw new Error(`connectPeers is not implemented for ${node.implementation} nodes`);
  }
  openChannel(
    from: LightningNode,
    toRpcUrl: string,
    amount: string,
  ): Promise<PLN.LightningNodeChannelPoint> {
    throw new Error(`openChannel is not implemented for ${from.implementation} nodes`);
  }
  closeChannel(node: LightningNode, channelPoint: string): Promise<any> {
    throw new Error(`closeChannel is not implemented for ${node.implementation} nodes`);
  }
  createInvoice(node: LightningNode, amount: number, memo?: string): Promise<string> {
    throw new Error(`createInvoice is not implemented for ${node.implementation} nodes`);
  }
  payInvoice(
    node: LightningNode,
    invoice: string,
    amount?: number,
  ): Promise<PLN.LightningNodePayReceipt> {
    throw new Error(`payInvoice is not implemented for ${node.implementation} nodes`);
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
}

export default new EclairService();
