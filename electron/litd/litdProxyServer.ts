import { IpcMain } from 'electron';
import { debug } from 'electron-log';
import { readFile } from 'fs-extra';
import * as LITD from '@lightningpolar/litd-api';
import {
  convertUInt8ArraysToHex,
  ipcChannels,
  LitdDefaultsKey,
  withLitdDefaults,
} from '../../src/shared';
import { LitdNode } from '../../src/shared/types';
import { toJSON } from '../../src/shared/utils';

/**
 * mapping of node name <-> LitRpcApis to cache these objects. The createLndRpc function
 * reads from disk, so this gives us a small bit of performance improvement
 */
let rpcCache: Record<string, LITD.LitRpcApis> = {};

/**
 * Helper function to lookup a node by name in the cache or create it if
 * it doesn't exist
 */
const getRpc = async (node: LitdNode): Promise<LITD.LitRpcApis> => {
  const { name, networkId } = node;
  const id = `n${networkId}-${name}`;
  if (!rpcCache[id]) {
    const { ports, paths } = node as LitdNode;
    const options: LITD.LitClientOptions = {
      socket: `127.0.0.1:${ports.web}`,
      cert: (await readFile(paths.litTlsCert)).toString('hex'),
      macaroon: (await readFile(paths.litMacaroon)).toString('hex'),
    };
    rpcCache[id] = LITD.LitClient.create(options);
  }
  return rpcCache[id];
};

const status = async (args: { node: LitdNode }): Promise<LITD.SubServerStatusResp> => {
  const { status } = await getRpc(args.node);
  return await status.subServerStatus();
};

const listSessions = async (args: {
  node: LitdNode;
}): Promise<LITD.ListSessionsResponse> => {
  const { sessions } = await getRpc(args.node);
  return await sessions.listSessions();
};

const addSession = async (args: {
  node: LitdNode;
  req: LITD.AddSessionRequestPartial;
}): Promise<LITD.AddSessionResponse> => {
  const { sessions } = await getRpc(args.node);
  return await sessions.addSession(args.req);
};

const revokeSession = async (args: {
  node: LitdNode;
  req: LITD.RevokeSessionRequest;
}): Promise<LITD.RevokeSessionResponse> => {
  const { sessions } = await getRpc(args.node);
  return await sessions.revokeSession(args.req);
};

/**
 * A mapping of electron IPC channel names to the functions to execute when
 * messages are received
 */
const listeners: {
  [key: string]: (...args: any) => Promise<any>;
} = {
  [ipcChannels.litd.status]: status,
  [ipcChannels.litd.listSessions]: listSessions,
  [ipcChannels.litd.addSession]: addSession,
  [ipcChannels.litd.revokeSession]: revokeSession,
};

/**
 * Sets up the IPC listeners for the main process and maps them to async
 * functions.
 * @param ipc the IPC object of the main process
 */
export const initLitdProxy = (ipc: IpcMain) => {
  debug('LitdProxyServer: initialize');
  Object.entries(listeners).forEach(([channel, func]) => {
    const requestChan = `litd-${channel}-request`;
    const responseChan = `litd-${channel}-response`;

    debug(`LitdProxyServer: listening for ipc command "${channel}"`);
    ipc.on(requestChan, async (event, ...args) => {
      // the a message is received by the main process...
      debug(`LitdProxyServer: received request "${requestChan}"`, toJSON(args));
      // inspect the first arg to see if it has a specific channel to reply to
      let uniqueChan = responseChan;
      if (args && args[0] && args[0].replyTo) {
        uniqueChan = args[0].replyTo;
      }
      try {
        // attempt to execute the associated function
        let result = await func(...args);
        // merge the result with default values since LND omits falsy values
        debug(`LitdProxyServer: send response "${uniqueChan}"`, toJSON(result));
        // add default values for missing objects
        result = withLitdDefaults(result, channel as LitdDefaultsKey);
        // convert UInt8Arrays to hex
        result = convertUInt8ArraysToHex(result);
        // response to the calling process with a reply
        event.reply(uniqueChan, result);
      } catch (err: any) {
        // reply with an error message if the execution fails
        debug(`LitdProxyServer: send error "${uniqueChan}"`, toJSON(err));
        event.reply(uniqueChan, { err: err.message });
      }
    });
  });
};

/**
 * Clears the cached rpc instances
 */
export const clearLitdProxyCache = () => {
  rpcCache = {};
};
