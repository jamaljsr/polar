/* eslint-disable @typescript-eslint/no-unused-vars */
import { LightningNode } from 'shared/types';
import {
  LightningNodeAddress,
  LightningNodeBalances,
  LightningNodeChannel,
  LightningNodeChannelPoint,
  LightningNodeInfo,
  LightningService,
} from './types';

/**
 * A Lightning Service class whose functionas are not yet implemented
 */
class NotImplementedService implements LightningService {
  getInfo(node: LightningNode): Promise<LightningNodeInfo> {
    throw new Error(`getInfo is not implemented for ${node.implementation} nodes`);
  }
  getBalances(node: LightningNode): Promise<LightningNodeBalances> {
    throw new Error(`getBalances is not implemented for ${node.implementation} nodes`);
  }
  waitUntilOnline(node: LightningNode): Promise<void> {
    throw new Error(
      `waitUntilOnline is not implemented for ${node.implementation} nodes`,
    );
  }
  getNewAddress(node: LightningNode): Promise<LightningNodeAddress> {
    throw new Error(`getNewAddress is not implemented for ${node.implementation} nodes`);
  }
  getChannels(node: LightningNode): Promise<LightningNodeChannel[]> {
    throw new Error(`getChannels is not implemented for ${node.implementation} nodes`);
  }
  openChannel(
    from: LightningNode,
    to: LightningNode,
    amount: string,
  ): Promise<LightningNodeChannelPoint> {
    throw new Error(`getChannels is not implemented for ${from.implementation} nodes`);
  }
  closeChannel(node: LightningNode, channelPoint: string): Promise<any> {
    throw new Error(`closeChannel is not implemented for ${node.implementation} nodes`);
  }
}

export default new NotImplementedService();
