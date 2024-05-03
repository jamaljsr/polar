import { IpcMain } from 'electron';
import { debug } from 'electron-log';
import { readFile } from 'fs-extra';
import * as TARO from '@lightningpolar/tapd-api';
import {
  convertUInt8ArraysToHex,
  ipcChannels,
  TapdDefaultsKey,
  withTapdDefaults,
} from '../../src/shared';
import { TapdNode } from '../../src/shared/types';

/**
 * mapping of node name <-> TapRpcApis to cache these objects. The createLndRpc function
 * reads from disk, so this gives us a small bit of performance improvement
 */
let rpcCache: Record<string, TARO.TapdRpcApis> = {};

/**
 * Helper function to lookup a node by name in the cache or create it if
 * it doesn't exist
 */
const getRpc = async (node: TapdNode): Promise<TARO.TapdRpcApis> => {
  const { name, networkId } = node;
  const id = `n${networkId}-${name}`;
  if (!rpcCache[id]) {
    const { ports, paths } = node as TapdNode;
    const options: TARO.TapdClientOptions = {
      socket: `127.0.0.1:${ports.grpc}`,
      cert: (await readFile(paths.tlsCert)).toString('hex'),
      macaroon: (await readFile(paths.adminMacaroon)).toString('hex'),
    };
    rpcCache[id] = TARO.TapClient.create(options);
  }
  return rpcCache[id];
};

const listAssets = async (args: { node: TapdNode }): Promise<TARO.ListAssetResponse> => {
  const { taprootAssets } = await getRpc(args.node);
  return await taprootAssets.listAssets();
};

const listBalances = async (args: {
  node: TapdNode;
}): Promise<TARO.ListBalancesResponse> => {
  const { taprootAssets } = await getRpc(args.node);
  return await taprootAssets.listBalances({
    assetId: true,
  });
};

const mintAsset = async (args: {
  node: TapdNode;
  req: TARO.MintAssetRequestPartial;
}): Promise<TARO.MintAssetResponse> => {
  const { mint } = await getRpc(args.node);
  return await mint.mintAsset(args.req);
};

const finalizeBatch = async (args: {
  node: TapdNode;
}): Promise<TARO.FinalizeBatchResponse> => {
  const { mint } = await getRpc(args.node);
  return await mint.finalizeBatch();
};

const newAddress = async (args: {
  node: TapdNode;
  req: TARO.NewAddrRequestPartial;
}): Promise<TARO.Addr> => {
  const { taprootAssets } = await getRpc(args.node);
  return await taprootAssets.newAddr(args.req);
};

const sendAsset = async (args: {
  node: TapdNode;
  req: TARO.SendAssetRequestPartial;
}): Promise<TARO.SendAssetResponse> => {
  const { taprootAssets } = await getRpc(args.node);
  return await taprootAssets.sendAsset(args.req);
};

const decodeAddress = async (args: {
  node: TapdNode;
  req: TARO.DecodeAddrRequestPartial;
}): Promise<TARO.Addr> => {
  const { taprootAssets } = await getRpc(args.node);
  return await taprootAssets.decodeAddr(args.req);
};

const assetRoots = async (args: { node: TapdNode }): Promise<TARO.AssetRootResponse> => {
  const { universe } = await getRpc(args.node);
  return await universe.assetRoots({ withAmountsById: true });
};

const assetLeaves = async (args: {
  node: TapdNode;
  req: TARO.IDPartial;
}): Promise<TARO.AssetLeafResponse> => {
  const { universe } = await getRpc(args.node);
  return await universe.assetLeaves(args.req);
};

const syncUniverse = async (args: {
  node: TapdNode;
  req: TARO.SyncRequestPartial;
}): Promise<TARO.SyncResponse> => {
  const { universe } = await getRpc(args.node);
  return await universe.syncUniverse(args.req);
};

/**
 * A mapping of electron IPC channel names to the functions to execute when
 * messages are received
 */
const listeners: {
  [key: string]: (...args: any) => Promise<any>;
} = {
  [ipcChannels.tapd.listAssets]: listAssets,
  [ipcChannels.tapd.listBalances]: listBalances,
  [ipcChannels.tapd.mintAsset]: mintAsset,
  [ipcChannels.tapd.finalizeBatch]: finalizeBatch,
  [ipcChannels.tapd.newAddress]: newAddress,
  [ipcChannels.tapd.sendAsset]: sendAsset,
  [ipcChannels.tapd.decodeAddress]: decodeAddress,
  [ipcChannels.tapd.assetRoots]: assetRoots,
  [ipcChannels.tapd.assetLeaves]: assetLeaves,
  [ipcChannels.tapd.syncUniverse]: syncUniverse,
};

/**
 * Sets up the IPC listeners for the main process and maps them to async
 * functions.
 * @param ipc the IPC object of the main process
 */
export const initTapdProxy = (ipc: IpcMain) => {
  debug('TapdProxyServer: initialize');
  Object.entries(listeners).forEach(([channel, func]) => {
    const requestChan = `tapd-${channel}-request`;
    const responseChan = `tapd-${channel}-response`;

    debug(`TapdProxyServer: listening for ipc command "${channel}"`);
    ipc.on(requestChan, async (event, ...args) => {
      // the a message is received by the main process...
      debug(
        `TapdProxyServer: received request "${requestChan}"`,
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
          `TapdProxyServer: send response "${uniqueChan}"`,
          JSON.stringify(result, null, 2),
        );
        // add default values for missing objects
        result = withTapdDefaults(result, channel as TapdDefaultsKey);
        // convert UInt8Arrays to hex
        result = convertUInt8ArraysToHex(result);
        // response to the calling process with a reply
        event.reply(uniqueChan, result);
      } catch (err: any) {
        // reply with an error message if the execution fails
        debug(
          `TapdProxyServer: send error "${uniqueChan}"`,
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
export const clearTapdProxyCache = () => {
  rpcCache = {};
};
