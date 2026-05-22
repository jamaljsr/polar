import { debug } from 'electron-log';
import { ipcChannels } from 'shared';
import { LdkServerNode } from 'shared/types';
import {
  createIpcSender,
  createIpcStreamer,
  IpcSender,
  IpcStreamer,
  IpcStreamEvent,
} from 'lib/ipc/ipcService';

type IpcListener = (event: IpcStreamEvent, data: any) => void;

class LdkProxyClient {
  ipc: IpcSender;
  streamer: IpcStreamer;
  listeners: Record<string, { listener: IpcListener; replyTo: string }> = {};

  constructor() {
    this.ipc = createIpcSender('LdkProxyClient', 'ldk');
    this.streamer = createIpcStreamer('LdkProxyClient', 'ldk');
  }

  async getInfo(node: LdkServerNode) {
    return await this.ipc(ipcChannels.ldk.getInfo, { node });
  }

  async getBalances(node: LdkServerNode) {
    return await this.ipc(ipcChannels.ldk.getBalances, { node });
  }

  async onchainReceive(node: LdkServerNode) {
    return await this.ipc(ipcChannels.ldk.onchainReceive, { node });
  }

  async listChannels(node: LdkServerNode) {
    return await this.ipc(ipcChannels.ldk.listChannels, { node });
  }

  async listPeers(node: LdkServerNode) {
    return await this.ipc(ipcChannels.ldk.listPeers, { node });
  }

  async connectPeer(node: LdkServerNode, req: any): Promise<void> {
    await this.ipc(ipcChannels.ldk.connectPeer, { node, req });
  }

  async openChannel(node: LdkServerNode, req: any) {
    return await this.ipc(ipcChannels.ldk.openChannel, { node, req });
  }

  async closeChannel(node: LdkServerNode, req: any) {
    return await this.ipc(ipcChannels.ldk.closeChannel, { node, req });
  }

  async bolt11Receive(node: LdkServerNode, req: any) {
    return await this.ipc(ipcChannels.ldk.bolt11Receive, { node, req });
  }

  async bolt11Send(node: LdkServerNode, req: any) {
    return await this.ipc(ipcChannels.ldk.bolt11Send, { node, req });
  }

  async decodeInvoice(node: LdkServerNode, req: any) {
    return await this.ipc(ipcChannels.ldk.decodeInvoice, { node, req });
  }

  async getPaymentDetails(node: LdkServerNode, req: any) {
    return await this.ipc(ipcChannels.ldk.getPaymentDetails, { node, req });
  }

  async subscribeEvents(
    node: LdkServerNode,
    callback: (data: any) => void,
  ): Promise<void> {
    const channel = `${ipcChannels.ldk.subscribeEvents}-${node.ports.grpc}`;
    const existing = this.listeners[channel];
    if (existing) {
      this.streamer.unsubscribe(existing.replyTo, existing.listener);
      delete this.listeners[channel];
      debug('LdkProxyClient: replaced existing subscription', channel);
    }
    const listener = (_: IpcStreamEvent, data: any) => {
      debug('LdkProxyClient: listener', data);
      callback(data);
    };
    const replyTo = this.streamer.subscribe(
      ipcChannels.ldk.subscribeEvents,
      { node },
      listener,
    );
    this.listeners[channel] = { listener, replyTo };
  }

  unsubscribeEvents(node: LdkServerNode) {
    const channel = `${ipcChannels.ldk.subscribeEvents}-${node.ports.grpc}`;
    const entry = this.listeners[channel];
    if (entry) {
      this.streamer.unsubscribe(entry.replyTo, entry.listener);
      delete this.listeners[channel];
      debug('LdkProxyClient: unsubscribeEvents deleted', channel);
    }
  }
}

export default new LdkProxyClient();
