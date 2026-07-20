// import * as ARK from '@lightningpolar/ark-api';
import { createIpcSender, IpcSender } from 'lib/ipc/ipcService';
import { ipcChannels } from 'shared';
import { ArkNode } from 'shared/types';

class ArkProxyClient {
  private ipc: IpcSender;

  constructor() {
    this.ipc = createIpcSender('ArkProxyClient', 'ark');
  }

  async getInfo(node: ArkNode): Promise<any> {
    return await this.ipc(ipcChannels.ark.getInfo, { node });
  }
}

export const arkProxyClient = new ArkProxyClient();
