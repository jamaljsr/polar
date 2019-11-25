/* eslint-disable @typescript-eslint/no-unused-vars */
import { LightningNode } from 'shared/types';
import { LightningService } from 'types';
import * as PLN from './types';

/**
 * A Lightning Service class whose functionas are not yet implemented
 */
class NotImplementedService implements LightningService {
  getInfo(node: LightningNode): Promise<PLN.LightningNodeInfo> {
    throw new Error(`getInfo is not implemented for ${node.implementation} nodes`);
  }
  getBalances(node: LightningNode): Promise<PLN.LightningNodeBalances> {
    throw new Error(`getBalances is not implemented for ${node.implementation} nodes`);
  }
  waitUntilOnline(node: LightningNode): Promise<void> {
    throw new Error(
      `waitUntilOnline is not implemented for ${node.implementation} nodes`,
    );
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
  openChannel(
    from: LightningNode,
    toRpcUrl: string,
    amount: string,
  ): Promise<PLN.LightningNodeChannelPoint> {
    throw new Error(`getChannels is not implemented for ${from.implementation} nodes`);
  }
  closeChannel(node: LightningNode, channelPoint: string): Promise<any> {
    throw new Error(`closeChannel is not implemented for ${node.implementation} nodes`);
  }
}

export default new NotImplementedService();
