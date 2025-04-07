import { TapNode } from 'shared/types';
import { TapService } from 'types';
import { tapdService } from './tapd';

/**
 * A factory class used to obtain a TAP service based on
 * the node's implementation
 */
class TapFactory {
  /**
   * The mapping of implementation types to services
   */
  private _services: Record<TapNode['implementation'], TapService>;

  constructor() {
    this._services = {
      tapd: tapdService,
      litd: tapdService,
    };
  }

  /**
   * Returns a TAP service for the given node
   * @param node the TAP node object
   */
  getService(node: TapNode): TapService {
    return this._services[node.implementation];
  }
}

export default TapFactory;
