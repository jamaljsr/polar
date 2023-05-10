import { IpcMain } from 'electron';
import { debug } from 'electron-log';
import { readFile } from 'fs-extra';
import * as TARO from '@hodlone/taro-api';
import {
  convertUInt8ArraysToHex,
  ipcChannels,
  TarodDefaultsKey,
  withTarodDefaults,
} from '../../src/shared';
import { TarodNode } from '../../src/shared/types';

/**
 * mapping of node name <-> TaroRpcApis to cache these objects. The createLndRpc function
 * reads from disk, so this gives us a small bit of performance improvement
 */
let rpcCache: Record<string, TARO.TaroRpcApis> = {};

/**
 * Helper function to lookup a node by name in the cache or create it if
 * it doesn't exist
 */
const getRpc = async (node: TarodNode): Promise<TARO.TaroRpcApis> => {
  const { name, ports, paths, networkId } = node;
  const id = `n${networkId}-${name}`;
  if (!rpcCache[id]) {
    const options: TARO.TaroClientOptions = {
      socket: `127.0.0.1:${ports.grpc}`,
      cert: (await readFile(paths.tlsCert)).toString('hex'),
      macaroon: (await readFile(paths.adminMacaroon)).toString('hex'),
    };
    rpcCache[id] = TARO.TaroClient.create(options);
  }
  return rpcCache[id];
};

const listAssets = async (args: { node: TarodNode }): Promise<TARO.ListAssetResponse> => {
  const { taro } = await getRpc(args.node);
  return await taro.listAssets();
};

const listBalances = async (args: {
  node: TarodNode;
}): Promise<TARO.ListBalancesResponse> => {
  const { taro } = await getRpc(args.node);
  return await taro.listBalances({
    assetId: true,
  });
};

const mintAsset = async (args: {
  node: TarodNode;
  req: TARO.MintAssetRequestPartial;
}): Promise<TARO.MintAssetResponse> => {
  const { mint } = await getRpc(args.node);
  return await mint.mintAsset(args.req);
};

const newAddress = async (args: {
  node: TarodNode;
  req: TARO.NewAddrRequestPartial;
}): Promise<TARO.Addr> => {
  const { taro } = await getRpc(args.node);
  return await taro.newAddr(args.req);
};

const sendAsset = async (args: {
  node: TarodNode;
  req: TARO.SendAssetRequestPartial;
}): Promise<TARO.SendAssetResponse> => {
  const { taro } = await getRpc(args.node);
  return await taro.sendAsset(args.req);
};

const decodeAddress = async (args: {
  node: TarodNode;
  req: TARO.DecodeAddrRequestPartial;
}): Promise<TARO.Addr> => {
  const { taro } = await getRpc(args.node);
  return await taro.decodeAddr(args.req);
};

/**
 * A mapping of electron IPC channel names to the functions to execute when
 * messages are received
 */
const listeners: {
  [key: string]: (...args: any) => Promise<any>;
} = {
  [ipcChannels.taro.listAssets]: listAssets,
  [ipcChannels.taro.listBalances]: listBalances,
  [ipcChannels.taro.mintAsset]: mintAsset,
  [ipcChannels.taro.newAddress]: newAddress,
  [ipcChannels.taro.sendAsset]: sendAsset,
  [ipcChannels.taro.decodeAddress]: decodeAddress,
};

/**
 * Sets up the IPC listeners for the main process and maps them to async
 * functions.
 * @param ipc the IPC object of the main process
 */
export const initTarodProxy = (ipc: IpcMain) => {
  debug('TarodProxyServer: initialize');
  Object.entries(listeners).forEach(([channel, func]) => {
    const requestChan = `tarod-${channel}-request`;
    const responseChan = `tarod-${channel}-response`;

    debug(`TarodProxyServer: listening for ipc command "${channel}"`);
    ipc.on(requestChan, async (event, ...args) => {
      // the a message is received by the main process...
      debug(
        `TarodProxyServer: received request "${requestChan}"`,
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
          `TarodProxyServer: send response "${uniqueChan}"`,
          JSON.stringify(result, null, 2),
        );
        // add default values for missing objects
        result = withTarodDefaults(result, channel as TarodDefaultsKey);
        // convert UInt8Arrays to hex
        result = convertUInt8ArraysToHex(result);
        // response to the calling process with a reply
        event.reply(uniqueChan, result);
      } catch (err: any) {
        // reply with an error message if the execution fails
        debug(
          `TarodProxyServer: send error "${uniqueChan}"`,
          JSON.stringify(err, null, 2),
        );
        event.reply(uniqueChan, { err: err.message });
      }
    });
  });
};

/**
 * Clears the cached rpc instances
 */
export const clearTarodProxyCache = () => {
  rpcCache = {};
};
