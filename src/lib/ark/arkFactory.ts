import { ArkNode } from 'shared/types';
import { ArkService } from 'types';
import { arkService } from './arkService';

/**
 * A factory class used to obtain a Ark service based on
 * the node's implementation
 */
export class ArkFactory {
  /**
   * The mapping of implementation types to services
   */
  private _services: Record<ArkNode['implementation'], ArkService>;

  constructor() {
    this._services = {
      arkd: arkService,
    };
  }

  /**
   * Returns a ark service for the given node
   * @param node the Ark node object
   */
  getService(node: ArkNode): ArkService {
    return this._services[node.implementation];
  }
}
