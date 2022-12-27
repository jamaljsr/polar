import { ListAssetsResponse } from 'shared/tarodTypes';
import { TarodNode, TaroNode } from 'shared/types';
import { TaroService } from 'types';
import { waitFor } from 'utils/async';
import { tarodProxyClient as proxy } from './';

class TarodService implements TaroService {
  async listAssets(node: TaroNode): Promise<ListAssetsResponse> {
    return await proxy.listAssets(this.cast(node));
  }

  /**
   * Helper function to continually query the LND node until a successful
   * response is received or it times out
   */
  async waitUntilOnline(
    node: TaroNode,
    interval = 3 * 1000, // check every 3 seconds
    timeout = 120 * 1000, // timeout after 120 seconds
  ): Promise<void> {
    return waitFor(
      async () => {
        await this.listAssets(node);
      },
      interval,
      timeout,
    );
  }

  private cast(node: TaroNode): TarodNode {
    if (node.implementation !== 'tarod')
      throw new Error(`TarodService cannot be used for '${node.implementation}' nodes`);

    return node as TarodNode;
  }
}

export default new TarodService();
