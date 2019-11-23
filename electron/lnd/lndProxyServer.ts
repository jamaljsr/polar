import { IpcMain } from 'electron';
import { debug } from 'electron-log';
import createLndRpc, * as LND from '@radar/lnrpc';
import { DefaultsKey, ipcChannels, withDefaults } from '../../src/shared';
import { LndNode } from '../../src/shared/types';

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
}): Promise<{}> => {
  const rpc = await getRpc(args.node);
  return await rpc.connectPeer(args.req);
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

/**
 * A mapping of electron IPC channel names to the functions to execute when
 * messages are recieved
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
};

/**
 * Sets up the IPC listeners for the main process and maps them to async
 * functions.
 * @param ipc the IPC onject of the main process
 */
export const initLndProxy = (ipc: IpcMain) => {
  debug('LndProxyServer: initialize');
  Object.entries(listeners).forEach(([channel, func]) => {
    const requestChan = `lnd-${channel}-request`;
    const responseChan = `lnd-${channel}-response`;

    debug(`listening for ipc command "${channel}"`);
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
        // merge the result with default values since LND omits falsey values
        debug(
          `LndProxyServer: send response "${uniqueChan}"`,
          JSON.stringify(result, null, 2),
        );
        result = withDefaults(result, channel as DefaultsKey);
        // response to the calling process with a reply
        event.reply(uniqueChan, result);
      } catch (err) {
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
export const clearProxyCache = () => {
  rpcCache = {};
};
