import { IpcMain } from 'electron';
import { debug } from 'electron-log';
import { LdkServerNode } from '../../src/shared/types';
import { toJSON } from '../../src/shared/utils';
import ldkGrpcClient from './ldkGrpcClient';

const ldkIpcChannels = {
  getInfo: 'get-info',
  getBalances: 'get-balances',
  onchainReceive: 'onchain-receive',
  listChannels: 'list-channels',
  listPeers: 'list-peers',
  connectPeer: 'connect-peer',
  openChannel: 'open-channel',
  closeChannel: 'close-channel',
  bolt11Receive: 'bolt11-receive',
  bolt11Send: 'bolt11-send',
  decodeInvoice: 'decode-invoice',
  getPaymentDetails: 'get-payment-details',
  subscribeEvents: 'subscribe-events',
};

const streamCleanups: Record<string, () => void> = {};

let sendStreamEvent: (channel: string, data: any) => void = () => {};

export const initLdkSubscriptions = (
  callback: (responseChan: string, data: any) => void,
) => {
  sendStreamEvent = callback;
};

const getInfo = async (args: { node: LdkServerNode }) => ldkGrpcClient.getInfo(args.node);

const getBalances = async (args: { node: LdkServerNode }) =>
  ldkGrpcClient.getBalances(args.node);

const onchainReceive = async (args: { node: LdkServerNode }) =>
  ldkGrpcClient.onchainReceive(args.node);

const listChannels = async (args: { node: LdkServerNode }) =>
  ldkGrpcClient.listChannels(args.node);

const listPeers = async (args: { node: LdkServerNode }) =>
  ldkGrpcClient.listPeers(args.node);

const connectPeer = async (args: { node: LdkServerNode; req: any }) =>
  ldkGrpcClient.connectPeer(args.node, args.req);

const openChannel = async (args: { node: LdkServerNode; req: any }) =>
  ldkGrpcClient.openChannel(args.node, args.req);

const closeChannel = async (args: { node: LdkServerNode; req: any }) =>
  ldkGrpcClient.closeChannel(args.node, args.req);

const bolt11Receive = async (args: { node: LdkServerNode; req: any }) =>
  ldkGrpcClient.bolt11Receive(args.node, args.req);

const bolt11Send = async (args: { node: LdkServerNode; req: any }) =>
  ldkGrpcClient.bolt11Send(args.node, args.req);

const decodeInvoice = async (args: { node: LdkServerNode; req: any }) =>
  ldkGrpcClient.decodeInvoice(args.node, args.req);

const getPaymentDetails = async (args: { node: LdkServerNode; req: any }) =>
  ldkGrpcClient.getPaymentDetails(args.node, args.req);

const subscribeEvents = async (args: { node: LdkServerNode; replyTo: string }) => {
  const { node, replyTo } = args;
  const streamKey = `${node.networkId}-${node.name}-${replyTo}`;

  if (streamCleanups[streamKey]) {
    streamCleanups[streamKey]();
  }

  streamCleanups[streamKey] = ldkGrpcClient.subscribeEvents(node, data => {
    debug('LdkProxyServer: stream event', toJSON(data));
    sendStreamEvent(replyTo, data);
  });
};

const listeners: Record<string, (...args: any[]) => Promise<any>> = {
  [ldkIpcChannels.getInfo]: getInfo,
  [ldkIpcChannels.getBalances]: getBalances,
  [ldkIpcChannels.onchainReceive]: onchainReceive,
  [ldkIpcChannels.listChannels]: listChannels,
  [ldkIpcChannels.listPeers]: listPeers,
  [ldkIpcChannels.connectPeer]: connectPeer,
  [ldkIpcChannels.openChannel]: openChannel,
  [ldkIpcChannels.closeChannel]: closeChannel,
  [ldkIpcChannels.bolt11Receive]: bolt11Receive,
  [ldkIpcChannels.bolt11Send]: bolt11Send,
  [ldkIpcChannels.decodeInvoice]: decodeInvoice,
  [ldkIpcChannels.getPaymentDetails]: getPaymentDetails,
  [ldkIpcChannels.subscribeEvents]: subscribeEvents,
};

export const initLdkProxy = (ipc: IpcMain) => {
  debug('LdkProxyServer: initialize');
  Object.entries(listeners).forEach(([channel, func]) => {
    const requestChan = `ldk-${channel}-request`;
    const responseChan = `ldk-${channel}-response`;

    debug(`LdkProxyServer: listening for ipc command "${channel}"`);
    ipc.on(requestChan, async (event, ...args) => {
      debug(`LdkProxyServer: received request "${requestChan}"`, toJSON(args));
      let uniqueChan = responseChan;
      if (args && args[0] && args[0].replyTo) {
        uniqueChan = args[0].replyTo;
      }
      try {
        const result = await func(...args);
        if (channel !== ldkIpcChannels.subscribeEvents) {
          debug(`LdkProxyServer: send response "${uniqueChan}"`, toJSON(result));
          event.reply(uniqueChan, result);
        }
      } catch (err: any) {
        debug(`LdkProxyServer: send error "${uniqueChan}"`, err);
        event.reply(uniqueChan, { err: err.message });
      }
    });
  });
};

export const clearLdkProxyCache = () => {
  ldkGrpcClient.clearCache();
  Object.values(streamCleanups).forEach(cleanup => cleanup());
  Object.keys(streamCleanups).forEach(key => delete streamCleanups[key]);
};

export { ldkIpcChannels };
