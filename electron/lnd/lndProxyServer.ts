import { IpcMain } from 'electron';
import { debug, error } from 'electron-log';
import { readFile } from 'fs-extra';
import * as LND from '@lightningpolar/lnd-api';
import { ipcChannels, LndDefaultsKey, withLndDefaults } from '../../src/shared';
// import { RpcStreamResponse } from '../../src/shared/ipcChannels';
import { LndNode } from '../../src/shared/types';
import { toJSON } from '../../src/shared/utils';

/**
 * callback function responsible for sending messages from ipcMain to ipcRenderer.
 * @param responseChan The response channel identifier / IPC channel name.
 * @param message The message to be sent.
 */
let sendStreamEvent: (channel: string, data: any) => void;

export const initLndSubscriptions = (
  callback: (responseChan: string, data: any) => void,
) => {
  // sendStreamEvent = (channel: string, data: any) => {
  //   debug(`LndProxyServer: send stream event "${data.channel}"`, toJSON(data));
  //   callback(`lnd-${ipcChannels.rpcStream}`, data);
  // };
  sendStreamEvent = callback;
};

/**
 * mapping of node name <-> LndRpcApis to cache these objects. The getRpc function
 * reads from disk, so this gives us a small bit of performance improvement
 */
let rpcCache: {
  [key: string]: LND.LndRpcApis;
} = {};

/**
 * Helper function to lookup a node by name in the cache or create it if
 * it doesn't exist
 */
const getRpc = async (node: LndNode): Promise<LND.LndRpcApis> => {
  const { name, ports, paths, networkId } = node;
  // TODO: use node unique id for caching since is an application level global variable
  const id = `n${networkId}-${name}`;
  if (!rpcCache[id]) {
    const config: LND.LndClientOptions = {
      socket: `127.0.0.1:${ports.grpc}`,
      cert: (await readFile(paths.tlsCert)).toString('hex'),
      macaroon: (await readFile(paths.adminMacaroon)).toString('hex'),
    };
    rpcCache[id] = LND.LndClient.create(config);
  }
  return rpcCache[id];
};

const getInfo = async (args: { node: LndNode }): Promise<LND.GetInfoResponse> => {
  const rpc = await getRpc(args.node);
  return await rpc.lightning.getInfo();
};

const walletBalance = async (args: {
  node: LndNode;
}): Promise<LND.WalletBalanceResponse> => {
  const rpc = await getRpc(args.node);
  return await rpc.lightning.walletBalance();
};

const newAddress = async (args: { node: LndNode }): Promise<LND.NewAddressResponse> => {
  const rpc = await getRpc(args.node);
  return await rpc.lightning.newAddress();
};

const listPeers = async (args: { node: LndNode }): Promise<LND.ListPeersResponse> => {
  const rpc = await getRpc(args.node);
  return await rpc.lightning.listPeers();
};

const connectPeer = async (args: {
  node: LndNode;
  req: LND.ConnectPeerRequest;
}): Promise<void> => {
  const rpc = await getRpc(args.node);
  await rpc.lightning.connectPeer(args.req);
};

const openChannel = async (args: {
  node: LndNode;
  req: LND.OpenChannelRequest;
}): Promise<LND.ChannelPoint> => {
  const rpc = await getRpc(args.node);
  args.req.satPerByte = args.req.satPerByte || '1';
  return await rpc.lightning.openChannelSync(args.req);
};

const closeChannel = async (args: {
  node: LndNode;
  req: LND.CloseChannelRequest;
}): Promise<any> => {
  const rpc = await getRpc(args.node);
  // TODO: capture the stream events and push them to the UI
  const stream = rpc.lightning.closeChannel(args.req);
  stream.on('error', err => error('LndProxyServer: closeChannel error', err));
  stream.on('end', () => debug('LndProxyServer: closeChannel stream ended'));
  stream.on('data', data =>
    debug('LndProxyServer: closeChannel stream data', toJSON(data)),
  );
  return {};
};

const listChannels = async (args: {
  node: LndNode;
  req: LND.ListChannelsRequest;
}): Promise<LND.ListChannelsResponse> => {
  const rpc = await getRpc(args.node);
  return await rpc.lightning.listChannels(args.req);
};

const pendingChannels = async (args: {
  node: LndNode;
}): Promise<LND.PendingChannelsResponse> => {
  const rpc = await getRpc(args.node);
  return await rpc.lightning.pendingChannels();
};

const getChanInfo = async (args: {
  node: LndNode;
  req: LND.ChanInfoRequestPartial;
}): Promise<LND.ChannelEdge> => {
  const rpc = await getRpc(args.node);
  return await rpc.lightning.getChanInfo(args.req);
};

const createInvoice = async (args: {
  node: LndNode;
  req: LND.Invoice;
}): Promise<LND.AddInvoiceResponse> => {
  const rpc = await getRpc(args.node);
  return await rpc.lightning.addInvoice(args.req);
};

const payInvoice = async (args: {
  node: LndNode;
  req: LND.SendPaymentRequestPartial;
}): Promise<LND.Payment> => {
  const rpc = await getRpc(args.node);
  args.req.timeoutSeconds = args.req.timeoutSeconds || 60;
  const stream = rpc.router.sendPaymentV2(args.req);
  // return a promise that resolves when the payment is completed
  return new Promise((resolve, reject) => {
    stream.on('data', (payment: LND.Payment) => {
      switch (payment.status) {
        case 'IN_FLIGHT':
          debug('LndProxyServer: payInvoice payment in-flight', toJSON(payment));
          break;
        case 'SUCCEEDED':
          resolve(payment);
          break;
        case 'FAILED':
        case 'UNKNOWN':
          debug(
            `LndProxyServer: payInvoice payment failed: ${payment.failureReason}`,
            toJSON(payment),
          );
          reject(new Error(`Payment failed: ${payment.failureReason}`));
          break;
      }
    });
    stream.on('error', err => reject(err));
    stream.on('end', () => reject(new Error('Payment stream ended')));
  });
};

const decodeInvoice = async (args: {
  node: LndNode;
  req: LND.PayReqString;
}): Promise<LND.PayReq> => {
  const rpc = await getRpc(args.node);
  return await rpc.lightning.decodePayReq(args.req);
};

const subscribeChannelEvents = async (args: {
  node: LndNode;
  replyTo: string;
}): Promise<any> => {
  debug('LndProxyServer: subscribeChannelEvents', toJSON(args));
  const rpc = await getRpc(args.node);
  const stream = rpc.lightning.subscribeChannelEvents();
  stream.on('data', (data: LND.ChannelEventUpdate) => {
    debug('LndProxyServer: stream event', args.node.name, args.replyTo, toJSON(data));
    sendStreamEvent(args.replyTo, data);
  });
  stream.on('error', err => debug('LndProxyServer: stream error', args.replyTo, err));
  stream.on('end', () => debug('LndProxyServer: stream ended', args.replyTo));
  return {};
};

/**
 * A mapping of electron IPC channel names to the functions to execute when
 * messages are received
 */
const listeners: {
  [key: string]: (...args: any) => Promise<any>;
} = {
  [ipcChannels.getInfo]: getInfo,
  [ipcChannels.walletBalance]: walletBalance,
  [ipcChannels.newAddress]: newAddress,
  [ipcChannels.listPeers]: listPeers,
  [ipcChannels.connectPeer]: connectPeer,
  [ipcChannels.openChannel]: openChannel,
  [ipcChannels.closeChannel]: closeChannel,
  [ipcChannels.listChannels]: listChannels,
  [ipcChannels.pendingChannels]: pendingChannels,
  [ipcChannels.getChanInfo]: getChanInfo,
  [ipcChannels.createInvoice]: createInvoice,
  [ipcChannels.payInvoice]: payInvoice,
  [ipcChannels.decodeInvoice]: decodeInvoice,
  [ipcChannels.subscribeChannelEvents]: subscribeChannelEvents,
};

/**
 * Sets up the IPC listeners for the main process and maps them to async
 * functions.
 * @param ipc the IPC object of the main process
 */
export const initLndProxy = (ipc: IpcMain) => {
  debug('LndProxyServer: initialize');
  Object.entries(listeners).forEach(([channel, func]) => {
    const requestChan = `lnd-${channel}-request`;
    const responseChan = `lnd-${channel}-response`;

    debug(`LndProxyServer: listening for ipc command "${channel}"`);
    ipc.on(requestChan, async (event, ...args) => {
      // the a message is received by the main process...
      debug(`LndProxyServer: received request "${requestChan}"`, toJSON(args));
      // inspect the first arg to see if it has a specific channel to reply to
      let uniqueChan = responseChan;
      if (args && args[0] && args[0].replyTo) {
        uniqueChan = args[0].replyTo;
      }
      try {
        // attempt to execute the associated function
        let result = await func(...args);
        // merge the result with default values since LND omits falsy values
        debug(`LndProxyServer: send response "${uniqueChan}"`, toJSON(result));
        result = withLndDefaults(result, channel as LndDefaultsKey);
        // response to the calling process with a reply
        event.reply(uniqueChan, result);
      } catch (err: any) {
        // reply with an error message if the execution fails
        debug(`LndProxyServer: send error "${uniqueChan}"`, err);
        event.reply(uniqueChan, { err: err.message });
      }
    });
  });
};

/**
 * Clears the cached rpc instances
 */
export const clearLndProxyCache = () => {
  rpcCache = {};
};
