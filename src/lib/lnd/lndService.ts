import { GetInfoResponse } from '@radar/lnrpc';
import { createIpcSender, IpcSender } from 'lib/ipc/ipcService';
import { LndLibrary, LndNode } from 'types';

class LndService implements LndLibrary {
  ipc: IpcSender;

  constructor() {
    this.ipc = createIpcSender('LndService', 'lnd');
  }

  async initialize(node: LndNode): Promise<void> {
    await this.ipc('initialize', { node });
  }

  async getInfo(node: LndNode): Promise<GetInfoResponse> {
    return await this.ipc('get-info', { name: node.name });
  }
}

export default new LndService();
