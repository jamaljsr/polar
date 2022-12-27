import { ipcChannels } from 'shared';
import { ListAssetsResponse } from 'shared/tarodTypes';
import { TarodNode } from 'shared/types';
import { createIpcSender, IpcSender } from 'lib/ipc/ipcService';

class TarodProxyClient {
  ipc: IpcSender;

  constructor() {
    this.ipc = createIpcSender('TarodProxyClient', 'tarod');
  }

  async listAssets(node: TarodNode): Promise<ListAssetsResponse> {
    return await this.ipc(ipcChannels.taro.listAssets, { node });
  }
}

export default new TarodProxyClient();
