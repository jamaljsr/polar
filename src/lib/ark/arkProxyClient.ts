import * as ARK from '@lightningpolar/arkd-api';
import { createIpcSender, IpcSender } from 'lib/ipc/ipcService';
import { ipcChannels } from 'shared';
import { ArkNode } from 'shared/types';

class ArkProxyClient {
  private ipc: IpcSender;

  constructor() {
    this.ipc = createIpcSender('ArkProxyClient', 'arkd');
  }

  async getInfo(node: ArkNode): Promise<ARK.GetInfoResponse> {
    return await this.ipc(ipcChannels.ark.getInfo, { node });
  }

  async waitForReady(node: ArkNode): Promise<void> {
    return this.ipc(ipcChannels.ark.waitForReady, { node });
  }

  async getWalletStatus(node: ArkNode): Promise<ARK.GetStatusResponse> {
    return this.ipc(ipcChannels.ark.getWalletStatus, { node });
  }

  async genSeed(node: ArkNode): Promise<string> {
    return this.ipc(ipcChannels.ark.genSeed, { node });
  }

  async createWallet(
    node: ArkNode,
    walletInfo: { password: string; seed: string },
  ): Promise<ARK.CreateResponse> {
    return this.ipc(ipcChannels.ark.createWallet, { node, ...walletInfo });
  }

  async lockWallet(node: ArkNode, password: string): Promise<ARK.LockRequest> {
    return this.ipc(ipcChannels.ark.lockWallet, { node, password });
  }

  async unlockWallet(node: ArkNode, password: string): Promise<ARK.UnlockResponse> {
    return this.ipc(ipcChannels.ark.unlockWallet, { node, password });
  }

  async getWalletBalance(node: ArkNode): Promise<ARK.GetBalanceResponse> {
    return this.ipc(ipcChannels.ark.getWalletBalance, { node });
  }

  async getBoardingAddress(
    node: ArkNode,
    pubkey: string,
  ): Promise<ARK.GetBoardingAddressResponse> {
    return this.ipc(ipcChannels.ark.getBoardingAddress, { node, pubkey });
  }
}

export const arkProxyClient = new ArkProxyClient();
