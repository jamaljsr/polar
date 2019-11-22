import { LightningNode } from 'shared/types';
import { clightningService } from 'lib/clightning';
import notImplementedService from './notImplementedService';
import { LightningService } from './types';

/**
 * A factory class used to obtain a Lightning service based on
 * the node's implementation
 */
class LightningFactory {
  /**
   * The mapping of implementation types to services
   */
  private _services: Record<LightningNode['implementation'], LightningService>;

  constructor() {
    this._services = {
      LND: notImplementedService,
      'c-lightning': clightningService,
      eclair: notImplementedService,
    };
  }

  /**
   * Returns a lightning service for the given node
   * @param node the Lightning node object
   */
  getService(node: LightningNode): LightningService {
    return this._services[node.implementation];
  }
}

export default LightningFactory;
