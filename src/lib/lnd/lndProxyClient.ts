import * as LND from '@radar/lnrpc';
import { createIpcSender, IpcSender } from 'lib/ipc/ipcService';
import { LndNode } from 'types';

class LndProxyClient {
  ipc: IpcSender;

  constructor() {
    this.ipc = createIpcSender('LndProxyClient', 'lnd');
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
    node: LndNode,
    req: LND.OpenChannelRequest,
  ): Promise<LND.ChannelPoint> {
    return await this.ipc('open-channel', { node, req });
  }
}

export default new LndProxyClient();
