import { TaroNode } from 'shared/types';
import { TaroService } from 'types';
import { tarodService } from './tarod';

/**
 * A factory class used to obtain a Taro service based on
 * the node's implementation
 */
class TaroFactory {
  /**
   * The mapping of implementation types to services
   */
  private _services: Record<TaroNode['implementation'], TaroService>;

  constructor() {
    this._services = {
      tarod: tarodService,
    };
  }

  /**
   * Returns a Taro service for the given node
   * @param node the Taro node object
   */
  getService(node: TaroNode): TaroService {
    return this._services[node.implementation];
  }
}

export default TaroFactory;
