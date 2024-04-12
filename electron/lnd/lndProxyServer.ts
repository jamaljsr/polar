import { IpcMain } from 'electron';
import { debug } from 'electron-log';
import createLndRpc, * as LND from '@radar/lnrpc';
import { ipcChannels, LndDefaultsKey, withLndDefaults } from '../../src/shared';
import { LndNode } from '../../src/shared/types';

/**
 * callback function responsible for sending messages from ipcMain to ipcRenderer.
 * @param responseChan The response channel identifier / IPC channel name.
 * @param message The message to be sent.
 */
let handleEventCallback: (responseChan: string, message: any) => void;

export const initLndSubscriptions = (
  callback: (responseChan: string, message: any) => void,
) => {
  handleEventCallback = callback;
};

/**
 * mapping of node name <-> LnRpc to cache these objects. The createLndRpc function
 * reads from disk, so this gives us a small bit of performance improvement
 */
let rpcCache: {
  [key: string]: LND.LnRpc;
} = {};

/**
 * Helper function to lookup a node by name in the cache or create it if
 * it doesn't exist
 */
const getRpc = async (node: LndNode): Promise<LND.LnRpc> => {
  const { name, ports, paths, networkId } = node;
  // TODO: use node unique id for caching since is an application level global variable
  const id = `n${networkId}-${name}`;
  if (!rpcCache[id]) {
    const config = {
      server: `127.0.0.1:${ports.grpc}`,
      tls: paths.tlsCert,
      macaroonPath: paths.adminMacaroon,
    };
    rpcCache[id] = await createLndRpc(config);
  }
  return rpcCache[id];
};

const getInfo = async (args: { node: LndNode }): Promise<LND.GetInfoResponse> => {
  const rpc = await getRpc(args.node);
  return await rpc.getInfo();
};

const walletBalance = async (args: {
  node: LndNode;
}): Promise<LND.WalletBalanceResponse> => {
  const rpc = await getRpc(args.node);
  return await rpc.walletBalance();
};

const newAddress = async (args: { node: LndNode }): Promise<LND.NewAddressResponse> => {
  const rpc = await getRpc(args.node);
  return await rpc.newAddress();
};

const listPeers = async (args: { node: LndNode }): Promise<LND.ListPeersResponse> => {
  const rpc = await getRpc(args.node);
  return await rpc.listPeers();
};

const connectPeer = async (args: {
  node: LndNode;
  req: LND.ConnectPeerRequest;
}): Promise<void> => {
  const rpc = await getRpc(args.node);
  await rpc.connectPeer(args.req);
};

const openChannel = async (args: {
  node: LndNode;
  req: LND.OpenChannelRequest;
}): Promise<LND.ChannelPoint> => {
  const rpc = await getRpc(args.node);
  return await rpc.openChannelSync(args.req);
};

const closeChannel = async (args: {
  node: LndNode;
  req: LND.CloseChannelRequest;
}): Promise<any> => {
  const rpc = await getRpc(args.node);
  // TODO: capture the stream events and push them to the UI
  rpc.closeChannel(args.req);
};

const listChannels = async (args: {
  node: LndNode;
  req: LND.ListChannelsRequest;
}): Promise<LND.ListChannelsResponse> => {
  const rpc = await getRpc(args.node);
  return await rpc.listChannels(args.req);
};

const pendingChannels = async (args: {
  node: LndNode;
}): Promise<LND.PendingChannelsResponse> => {
  const rpc = await getRpc(args.node);
  return await rpc.pendingChannels();
};

const createInvoice = async (args: {
  node: LndNode;
  req: LND.Invoice;
}): Promise<LND.AddInvoiceResponse> => {
  const rpc = await getRpc(args.node);
  return await rpc.addInvoice(args.req);
};

const payInvoice = async (args: {
  node: LndNode;
  req: LND.SendRequest;
}): Promise<LND.SendResponse> => {
  const rpc = await getRpc(args.node);
  return await rpc.sendPaymentSync(args.req);
};

const decodeInvoice = async (args: {
  node: LndNode;
  req: LND.PayReqString;
}): Promise<LND.PayReq> => {
  const rpc = await getRpc(args.node);
  return await rpc.decodePayReq(args.req);
};

const subscribeChannelEvents = async (args: { node: LndNode }): Promise<any> => {
  try {
    const rpc = await getRpc(args.node);
    const responseChan = `lnd-${ipcChannels.subscribeChannelEvents}-response-${args.node.ports.rest}`;
    const stream = rpc.subscribeChannelEvents();
    if (stream) {
      stream.on('data', (data: LND.ChannelEventUpdate) => {
        handleEventCallback(responseChan, data);
      });
    }
    return {};
  } catch (err) {
    return { err };
  }
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
      debug(
        `LndProxyServer: received request "${requestChan}"`,
        JSON.stringify(args, null, 2),
      );
      // inspect the first arg to see if it has a specific channel to reply to
      let uniqueChan = responseChan;
      if (args && args[0] && args[0].replyTo) {
        uniqueChan = args[0].replyTo;
      }
      try {
        // attempt to execute the associated function
        let result = await func(...args);
        // merge the result with default values since LND omits falsy values
        debug(
          `LndProxyServer: send response "${uniqueChan}"`,
          JSON.stringify(result, null, 2),
        );
        result = withLndDefaults(result, channel as LndDefaultsKey);
        // response to the calling process with a reply
        event.reply(uniqueChan, result);
      } catch (err: any) {
        // reply with an error message if the execution fails
        debug(`LndProxyServer: send error "${uniqueChan}"`, JSON.stringify(err, null, 2));
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
