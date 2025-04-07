import { debug } from 'electron-log';
import * as LND from '@lightningpolar/lnd-api';
import { ipcChannels } from 'shared';
import { LndNode } from 'shared/types';
import {
  createIpcSender,
  createIpcStreamer,
  IpcSender,
  IpcStreamer,
  IpcStreamEvent,
} from 'lib/ipc/ipcService';

type IpcListener = (event: IpcStreamEvent, data: any) => void;

class LndProxyClient {
  ipc: IpcSender;
  streamer: IpcStreamer;
  listeners: Record<string, IpcListener> = {};

  constructor() {
    this.ipc = createIpcSender('LndProxyClient', 'lnd');
    this.streamer = createIpcStreamer('LndProxyClient', 'lnd');
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

  async getChanInfo(
    node: LndNode,
    req: LND.ChanInfoRequestPartial,
  ): Promise<LND.ChannelEdge> {
    return await this.ipc(ipcChannels.getChanInfo, { node, req });
  }

  async createInvoice(
    node: LndNode,
    req: LND.InvoicePartial,
  ): Promise<LND.AddInvoiceResponse> {
    return await this.ipc(ipcChannels.createInvoice, { node, req });
  }

  async payInvoice(
    node: LndNode,
    req: LND.SendPaymentRequestPartial,
  ): Promise<LND.Payment> {
    return await this.ipc(ipcChannels.payInvoice, { node, req });
  }

  async decodeInvoice(node: LndNode, req: LND.PayReqStringPartial): Promise<LND.PayReq> {
    return await this.ipc(ipcChannels.decodeInvoice, { node, req });
  }

  async subscribeChannelEvents(
    node: LndNode,
    callback: (data: LND.ChannelEventUpdate) => void,
  ): Promise<void> {
    const channel = `${ipcChannels.subscribeChannelEvents}-${node.ports.rest}`;
    // create a listener for the stream. Wee need to keep a reference to the listener
    // so we can unsubscribe later
    const listener = (_: IpcStreamEvent, data: LND.ChannelEventUpdate) => {
      debug('LndProxyClient: listener', data);
      callback(data);
    };
    this.listeners[channel] = listener;
    // subscribe to the stream
    this.streamer.subscribe(ipcChannels.subscribeChannelEvents, { node }, listener);
  }

  unsubscribeEvents(node: LndNode) {
    const channel = `${ipcChannels.subscribeChannelEvents}-${node.ports.rest}`;
    if (this.listeners[channel]) {
      // unsubscribe from the stream
      this.streamer.unsubscribe(channel, this.listeners[channel]);
      delete this.listeners[channel];
      debug('LndProxyClient: unsubscribeEvents deleted', channel);
    }
  }
}

export default new LndProxyClient();
