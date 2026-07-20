import { debug } from 'electron-log';
import * as PLA from 'lib/ark/types';
import { ArkNode } from 'shared/types';
import { ArkService as IArkService } from 'types';
import { waitFor } from 'utils/async';
import { dockerConfigs } from 'utils/constants';
import { arkProxyClient as proxy } from './arkProxyClient';

export class ArkdService implements IArkService {
  constructor(private node: ArkNode) {}

  async getInfo(): Promise<PLA.ArkGetInfo> {
    const info = await proxy.getInfo(this.node);
    debug(`Arkd info for node ${this.node.name}: ${JSON.stringify(info)}`);
    return info;
  }

  /**
   * Helper function to continually query the ARK node until a successful
   * response is received or it times out
   */
  async waitUntilOnline(
    interval = 3 * 1000, // check every 3 seconds
    timeout = 30 * 1000, // timeout after 30 seconds
  ): Promise<void> {
    return waitFor(
      async () => {
        await proxy.waitForReady(this.node);
      },
      interval,
      timeout,
    );
  }

  async getWalletStatus(): Promise<PLA.ArkGetWalletStatus> {
    return proxy.getWalletStatus(this.node);
  }

  async initWallet(): Promise<PLA.ArkGetWalletStatus> {
    debug('Generating new wallet for arkd node: ', this.node.name);
    const seed = await proxy.genSeed(this.node);
    const password =
      this.node.docker.envVars?.ARK_UNLOCKER_PASSWORD ||
      dockerConfigs.arkd.envVars!.ARK_UNLOCKER_PASSWORD;

    await proxy.createWallet(this.node, {
      seed,
      password,
    });
    await this.unlockWallet(password);

    const status = await this.getWalletStatus();
    debug(`Status after generating arkd wallet`, JSON.stringify(status));

    return status;
  }

  async unlockWallet(password: string) {
    return proxy.unlockWallet(this.node, password);
  }

  async lockWallet(password: string) {
    return proxy.lockWallet(this.node, password);
  }

  async getWalletBalance(): Promise<PLA.ArkGetBalance> {
    return proxy.getWalletBalance(this.node);
  }
}
