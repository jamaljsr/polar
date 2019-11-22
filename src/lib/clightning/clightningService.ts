import { CLightningNode } from 'shared/types';
import { CLightningLibrary } from 'types';
import { waitFor } from 'utils/async';
import { read } from 'utils/files';
import { snakeKeysToCamel } from 'utils/objects';
import * as CLN from './clightningTypes';

class CLightningService implements CLightningLibrary {
  async getInfo(node: CLightningNode): Promise<CLN.GetInfoResponse> {
    return await this.request(node, 'getinfo');
  }

  async getBalance(node: CLightningNode): Promise<CLN.GetBalanceResponse> {
    return await this.request(node, 'getBalance');
  }

  /**
   * Helper function to continually query the node until a successful
   * response is received or it times out
   */
  async waitUntilOnline(
    node: CLightningNode,
    interval = 3 * 1000, // check every 3 seconds
    timeout = 30 * 1000, // timeout after 30 seconds
  ): Promise<void> {
    return waitFor(
      async () => {
        await this.getInfo(node);
      },
      interval,
      timeout,
    );
  }

  private async request(node: CLightningNode, path: string) {
    const { paths, ports } = node;
    const url = `http://127.0.0.1:${ports.rest}/v1/${path}`;
    const macaroon = await read(paths.macaroon, 'base64');
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        macaroon,
      },
    });
    return snakeKeysToCamel(await response.json());
  }
}

export default new CLightningService();
