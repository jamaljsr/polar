import { debug } from 'electron-log';
import * as PLA from 'lib/ark/types';
import { ArkNode } from 'shared/types';
import { ArkService as IArkService } from 'types';
import { waitFor } from 'utils/async';
import { arkProxyClient as proxy } from './arkProxyClient';

class ArkService implements IArkService {
  async getInfo(node: ArkNode): Promise<PLA.ArkNodeInfo> {
    const info = await proxy.getInfo(node);
    debug('Ark info: ' + JSON.stringify(info));
    return {
      pubkey: info.identityPubkey,
      alias: info.alias,
      rpcUrl: (info.uris && info.uris[0]) || '',
      syncedToChain: info.syncedToChain,
      blockHeight: info.blockHeight,
      numActiveChannels: info.numActiveChannels,
      numPendingChannels: info.numPendingChannels,
      numInactiveChannels: info.numInactiveChannels,
    };
  }

  /**
   * Helper function to continually query the ARK node until a successful
   * response is received or it times out
   */
  async waitUntilOnline(
    node: ArkNode,
    interval = 3 * 1000, // check every 3 seconds
    timeout = 120 * 1000, // timeout after 120 seconds
  ): Promise<void> {
    return waitFor(
      async () => {
        await this.getInfo(node);
      },
      interval,
      timeout,
    );
  }
}

export const arkService = new ArkService();
