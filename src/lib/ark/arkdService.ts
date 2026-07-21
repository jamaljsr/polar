import { debug } from 'electron-log';
import { ArkNode } from 'shared/types';
import * as PLA from 'lib/ark/types';
import { ArkService as IArkService } from 'types';
import { waitFor } from 'utils/async';
import { arkCredentials, dockerConfigs } from 'utils/constants';
import { arkProxyClient as proxy } from './arkProxyClient';

class ArkdService implements IArkService {
  async getInfo(node: ArkNode): Promise<PLA.ArkGetInfo> {
    const info = await proxy.getInfo(node);
    debug(`Arkd info for node ${node.name}: ${JSON.stringify(info)}`);
    return info;
  }

  /**
   * Helper function to continually query the ARK node until a successful
   * response is received or it times out
   */
  async waitUntilOnline(
    node: ArkNode,
    interval = 3 * 1000, // check every 3 seconds
    timeout = 30 * 1000, // timeout after 30 seconds
  ): Promise<void> {
    return waitFor(
      async () => {
        await proxy.waitForReady(node);
      },
      interval,
      timeout,
    );
  }

  async getWalletStatus(node: ArkNode): Promise<PLA.ArkGetWalletStatus> {
    return proxy.getWalletStatus(node);
  }

  async initWallet(node: ArkNode): Promise<PLA.ArkGetWalletStatus> {
    debug('Generating new wallet for arkd node: ', node.name);
    const seed = await proxy.genSeed(node);
    const password =
      node.docker.envVars?.ARK_UNLOCKER_PASSWORD ||
      dockerConfigs.arkd.envVars?.ARK_UNLOCKER_PASSWORD ||
      arkCredentials.pass;

    await proxy.createWallet(node, {
      seed,
      password,
    });
    await this.unlockWallet(node, password);

    const status = await waitFor(
      async () => {
        const status = await proxy.getWalletStatus(node);
        if (!status.initialized || !status.unlocked || !status.synced) {
          debug('Ark wallet not ready');
          throw new Error('Ark wallet not ready');
        }
        return status;
      },
      1_000,
      30_000,
    );
    debug(`Status after generating arkd wallet`, JSON.stringify(status));

    return status;
  }

  async unlockWallet(node: ArkNode, password: string) {
    return proxy.unlockWallet(node, password);
  }

  async lockWallet(node: ArkNode, password: string) {
    return proxy.lockWallet(node, password);
  }

  async getWalletBalance(node: ArkNode): Promise<PLA.ArkGetBalance> {
    return proxy.getWalletBalance(node);
  }

  async getBoardingAddress(node: ArkNode, pubkey: string): Promise<string> {
    return proxy.getBoardingAddress(node, pubkey).then(r => r.address);
  }
}

export default new ArkdService();
