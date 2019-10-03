import * as LND from '@radar/lnrpc';
import { createIpcSender, IpcSender } from 'lib/ipc/ipcService';
import { LndLibrary, LndNode } from 'types';
import { waitFor } from 'utils/async';

class LndService implements LndLibrary {
  ipc: IpcSender;

  constructor() {
    this.ipc = createIpcSender('LndService', 'lnd');
  }

  async getInfo(node: LndNode): Promise<LND.GetInfoResponse> {
    return await this.ipc('get-info', { node });
  }

  async getWalletBalance(node: LndNode): Promise<LND.WalletBalanceResponse> {
    return await this.ipc('wallet-balance', { node });
  }

  async getNewAddress(node: LndNode): Promise<LND.NewAddressResponse> {
    return await this.ipc('new-address', { node });
  }

  async openChannel(
    from: LndNode,
    to: LndNode,
    amount: string,
  ): Promise<LND.ChannelPoint> {
    // get peers

    // add peer if not already

    // get pubkey of dest node

    // open channel
    return await this.ipc('open-channel', { node: from, toPubKey: '', amount });
  }

  async waitUntilOnline(
    node: LndNode,
    interval = 3 * 1000, // check every 3 seconds
    timeout = 30 * 1000, // timeout after 30 seconds
  ): Promise<boolean> {
    return waitFor(
      async () => {
        try {
          await this.getInfo(node);
          return true;
        } catch {
          return false;
        }
      },
      interval,
      timeout,
    );
  }
}

export default new LndService();
