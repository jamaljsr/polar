import BitcoindService from './bitcoindService';
import BtcdService from './btcd/btcdService';
import { BitcoinNode } from 'shared/types';

class BitcoinFactory {
  /**
   * The mapping of implementation types to Bitcoin services
   */
  private _services: Record<BitcoinNode['implementation'], any>;

  constructor() {
    this._services = {
      bitcoind: BitcoindService,
      btcd: BtcdService,
    };
  }

  /**
   * Returns a Bitcoin service for the given node
   * @param node the Bitcoin node object
   */
  getService(node: BitcoinNode) {
    const service = this._services[node.implementation];
    if (!service) {
      throw new Error(`Service for implementation '${node.implementation}' not found`);
    }
    return service;
  }
}

export default BitcoinFactory;
