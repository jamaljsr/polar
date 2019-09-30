import { GetInfoResponse } from '@radar/lnrpc';
import { createIpcSender, IpcSender } from 'lib/ipc/ipcService';
import { LndLibrary, LndNode } from 'types';
import { waitFor } from 'utils/async';

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

  async waitUntilOnline(node: LndNode): Promise<boolean> {
    return waitFor(
      async () => {
        try {
          await this.getInfo(node);
          return Promise.resolve(true);
        } catch {
          return Promise.resolve(false);
        }
      },
      3 * 1000, // check every 3 seconds
      30 * 1000, // timeout after 30 seconds
    );
  }
}

export default new LndService();
