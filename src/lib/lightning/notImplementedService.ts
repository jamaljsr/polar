import { LightningNode } from 'shared/types';
import { LightningNodeBalances, LightningNodeInfo, LightningService } from './types';

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
}

export default new NotImplementedService();
