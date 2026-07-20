import * as ARKD from '@lightningpolar/arkd-api';
import { IpcMain } from 'electron';
import { debug } from 'electron-log';
import { existsSync } from 'fs';
import { readFile } from 'fs/promises';
import { convertUInt8ArraysToHex, ipcChannels } from '../../src/shared';
import { ArkdNode } from '../../src/shared/types';
import { toJSON } from '../../src/shared/utils';
import { ValueOf } from '../utils/types';

/**
 * mapping of node name and network <-> ArkRpcApis to cache these objects. The getRpc function
 * reads from disk, so this gives us a small bit of performance improvement
 */
let rpcCache: Record<string, ARKD.ArkdClient> = {};

/**
 * Helper function to lookup a node by name in the cache or create it if
 * it doesn't exist
 */
const getRpc = async (node: ArkdNode): Promise<ARKD.ArkdClient> => {
  const { name, networkId } = node;
  const id = `n${networkId}-${name}`;
  if (!rpcCache[id]) {
    const { ports, paths } = node as ArkdNode;
    const options: ARKD.ArkdClientOptions = {
      socket: `127.0.0.1:${ports.api}`,
      cert: existsSync(paths.tlsCert)
        ? (await readFile(paths.tlsCert)).toString('hex')
        : undefined,
      macaroon: existsSync(paths.macaroon)
        ? (await readFile(paths.macaroon)).toString('hex')
        : undefined,
    };
    rpcCache[id] = ARKD.ArkdClient.create(options);
  }
  return rpcCache[id];
};

const getInfo = async (args: { node: ArkdNode }) => {
  const rpc = await getRpc(args.node);
  return rpc.arkService.getInfo({});
};

const ping = async (args: { node: ArkdNode }) => {
  const rpc = await getRpc(args.node);
  return rpc.arkService.ping({
    requestId: Math.random() * 1000 + '',
  });
};

const getBalance = async (args: { node: ArkdNode }) => {
  const rpc = await getRpc(args.node);
  return rpc.wallet.getBalance({});
};

// const waitForReady = async (args: { node: ArkdNode }): Promise<void> => {
//   const rpc = await getRpc(args.node);
//   return rpc.arkService.waitForReady(30_000);
// };

/**
 * A mapping of electron IPC channel names to the functions to execute when
 * messages are received
 */
const listeners: Record<
  ValueOf<typeof ipcChannels.ark>,
  (...args: any) => Promise<any>
> = {
  [ipcChannels.ark.getInfo]: getInfo,
  [ipcChannels.ark.getBalance]: getBalance,
  [ipcChannels.ark.waitForReady]: ping,
};

/**
 * Sets up the IPC listeners for the main process and maps them to async
 * functions.
 * @param ipc the IPC object of the main process
 */
export const initArkdProxy = (ipc: IpcMain) => {
  debug('ArkdProxyServer: initialize');
  Object.entries(listeners).forEach(([channel, func]) => {
    const requestChan = `arkd-${channel}-request`;
    const responseChan = `arkd-${channel}-response`;

    debug(`ArkdProxyServer: listening for ipc command "${channel}"`);
    ipc.on(requestChan, async (event, ...args) => {
      // the a message is received by the main process...
      debug(`ArkdProxyServer: received request "${requestChan}"`, toJSON(args));
      // inspect the first arg to see if it has a specific channel to reply to
      let uniqueChan = responseChan;
      if (args && args[0] && args[0].replyTo) {
        uniqueChan = args[0].replyTo;
      }
      try {
        // attempt to execute the associated function
        let result = await func(...args);
        // merge the result with default values since LND omits falsy values
        debug(`ArkdProxyServer: send response "${uniqueChan}"`, toJSON(result));
        // convert UInt8Arrays to hex
        result = convertUInt8ArraysToHex(result);
        // response to the calling process with a reply
        event.reply(uniqueChan, result);
      } catch (err: any) {
        // reply with an error message if the execution fails
        debug(`ArkdProxyServer: send error "${uniqueChan}"`, toJSON(err));
        event.reply(uniqueChan, { err: err.message });
      }
    });
  });
};

/**
 * Clears the cached rpc instances
 */
export const clearArkdProxyCache = () => {
  rpcCache = {};
};
