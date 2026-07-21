import { ArkNode } from 'shared/types';
import { ArkService as IArkService } from 'types';
import arkdService from './arkdService';

/**
 * A factory class used to obtain a Ark service based on
 * the node's implementation
 */
export class ArkFactory {
  /**
   * The mapping of implementation types to services
   */
  private _services: Record<ArkNode['implementation'], IArkService>;

  constructor() {
    this._services = {
      arkd: arkdService,
    };
  }

  /**
   * Returns a ark service for the given node
   * @param node the Ark node object
   */
  getService(node: ArkNode): IArkService {
    return this._services[node.implementation];
  }
}
