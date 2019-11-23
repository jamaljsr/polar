import { LightningNode } from 'shared/types';
import {
  LightningNodeAddress,
  LightningNodeBalances,
  LightningNodeInfo,
  LightningService,
} from './types';

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
}

export default new NotImplementedService();
