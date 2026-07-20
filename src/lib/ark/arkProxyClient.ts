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
}

export const arkProxyClient = new ArkProxyClient();
