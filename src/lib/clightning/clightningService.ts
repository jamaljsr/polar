import { CLightningNode, LightningNode } from 'shared/types';
import {
  LightningNodeBalances,
  LightningNodeInfo,
  LightningService,
} from 'lib/lightning/types';
import { waitFor } from 'utils/async';
import { read } from 'utils/files';
import { snakeKeysToCamel } from 'utils/objects';
import * as CLN from './types';

class CLightningService implements LightningService {
  async getInfo(node: LightningNode): Promise<LightningNodeInfo> {
    const info = await this.request<CLN.GetInfoResponse>(node, 'getinfo');
    return {
      pubkey: info.id,
      alias: info.alias,
      rpcUrl: '',
      syncedToChain: !info.warningBitcoindSync,
      numActiveChannels: info.numActiveChannels,
      numPendingChannels: info.numPendingChannels,
      numInactiveChannels: info.numInactiveChannels,
    };
  }

  async getBalances(node: LightningNode): Promise<LightningNodeBalances> {
    const balances = await this.request<CLN.GetBalanceResponse>(node, 'getBalance');
    return {
      total: balances.totalBalance.toString(),
      confirmed: balances.confBalance.toString(),
      unconfirmed: balances.unconfBalance.toString(),
    };
  }

  /**
   * Helper function to continually query the node until a successful
   * response is received or it times out
   */
  async waitUntilOnline(
    node: LightningNode,
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

  private async request<T>(node: LightningNode, path: string) {
    const { paths, ports } = this.cast(node);
    const url = `http://127.0.0.1:${ports.rest}/v1/${path}`;
    const macaroon = await read(paths.macaroon, 'base64');
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        macaroon,
      },
    });
    return snakeKeysToCamel(await response.json()) as T;
  }

  private cast(node: LightningNode): CLightningNode {
    if (node.implementation !== 'c-lightning')
      throw new Error(
        `ClightningService cannot be used for '${node.implementation}' nodes`,
      );

    return node as CLightningNode;
  }
}

export default new CLightningService();
