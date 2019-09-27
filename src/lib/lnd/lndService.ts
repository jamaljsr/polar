import { GetInfoResponse } from '@radar/lnrpc';
import { createIpcSender, IcpSender } from 'lib/ipc/ipcService';
import { LndLibrary, LNDNode } from 'types';

class LndService implements LndLibrary {
  ipc: IcpSender;

  constructor() {
    this.ipc = createIpcSender('LndService', 'lnd');
  }

  async connect(node: LNDNode): Promise<void> {
    await this.ipc('connect', { node });
  }

  async getInfo(node: LNDNode): Promise<GetInfoResponse> {
    return await this.ipc('get-info', { name: node.name });
  }
}

export default new LndService();
