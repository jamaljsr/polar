import * as LND from '@radar/lnrpc';
import { ipcChannels } from 'shared';
import { LndNode } from 'shared/types';
import { createIpcSender, IpcSender } from 'lib/ipc/ipcService';

class LndProxyClient {
  ipc: IpcSender;

  constructor() {
    this.ipc = createIpcSender('LndProxyClient', 'lnd');
  }

  async getInfo(node: LndNode): Promise<LND.GetInfoResponse> {
    return await this.ipc(ipcChannels.getInfo, { node });
  }

  async getWalletBalance(node: LndNode): Promise<LND.WalletBalanceResponse> {
    return await this.ipc(ipcChannels.walletBalance, { node });
  }

  async getNewAddress(node: LndNode): Promise<LND.NewAddressResponse> {
    return await this.ipc(ipcChannels.newAddress, { node });
  }

  async listPeers(node: LndNode): Promise<LND.ListPeersResponse> {
    return await this.ipc(ipcChannels.listPeers, { node });
  }

  async connectPeer(node: LndNode, req: LND.ConnectPeerRequest): Promise<void> {
    await this.ipc(ipcChannels.connectPeer, { node, req });
  }

  async openChannel(
    node: LndNode,
    req: LND.OpenChannelRequest,
  ): Promise<LND.ChannelPoint> {
    return await this.ipc(ipcChannels.openChannel, { node, req });
  }

  async closeChannel(node: LndNode, req: LND.CloseChannelRequest): Promise<any> {
    return await this.ipc(ipcChannels.closeChannel, { node, req });
  }

  async listChannels(
    node: LndNode,
    req: LND.ListChannelsRequest,
  ): Promise<LND.ListChannelsResponse> {
    return await this.ipc(ipcChannels.listChannels, { node, req });
  }

  async pendingChannels(node: LndNode): Promise<LND.PendingChannelsResponse> {
    return await this.ipc(ipcChannels.pendingChannels, { node });
  }
}

export default new LndProxyClient();
