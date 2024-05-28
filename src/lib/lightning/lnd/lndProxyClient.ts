import * as LND from '@lightningpolar/lnd-api';
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

  async connectPeer(node: LndNode, req: LND.ConnectPeerRequestPartial): Promise<void> {
    await this.ipc(ipcChannels.connectPeer, { node, req });
  }

  async openChannel(
    node: LndNode,
    req: LND.OpenChannelRequestPartial,
  ): Promise<LND.ChannelPoint> {
    return await this.ipc(ipcChannels.openChannel, { node, req });
  }

  async closeChannel(node: LndNode, req: LND.CloseChannelRequestPartial): Promise<any> {
    return await this.ipc(ipcChannels.closeChannel, { node, req });
  }

  async listChannels(
    node: LndNode,
    req: LND.ListChannelsRequestPartial,
  ): Promise<LND.ListChannelsResponse> {
    return await this.ipc(ipcChannels.listChannels, { node, req });
  }

  async pendingChannels(node: LndNode): Promise<LND.PendingChannelsResponse> {
    return await this.ipc(ipcChannels.pendingChannels, { node });
  }

  async createInvoice(
    node: LndNode,
    req: LND.InvoicePartial,
  ): Promise<LND.AddInvoiceResponse> {
    return await this.ipc(ipcChannels.createInvoice, { node, req });
  }

  async payInvoice(
    node: LndNode,
    req: LND.SendRequestPartial,
  ): Promise<LND.SendResponse> {
    return await this.ipc(ipcChannels.payInvoice, { node, req });
  }

  async decodeInvoice(node: LndNode, req: LND.PayReqStringPartial): Promise<LND.PayReq> {
    return await this.ipc(ipcChannels.decodeInvoice, { node, req });
  }

  async subscribeChannelEvents(
    node: LndNode,
    callback: (event: LND.ChannelEventUpdate) => void,
  ): Promise<any> {
    return await this.ipc(ipcChannels.subscribeChannelEvents, { node }, callback);
  }
}

export default new LndProxyClient();
