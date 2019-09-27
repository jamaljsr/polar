import { IpcMain } from 'electron';
import { debug } from 'electron-log';
import createLndRpc, { GetInfoResponse, LnRpc } from '@radar/lnrpc';
import { LNDNode } from '../types';

// mapping of name <-> node to talk to multiple nodes
const nodes: {
  [key: string]: LnRpc;
} = {};

/**
 * Stores the connection info of a LND node to use for future commands
 * @param args the LNDNode to connect to
 */
const initialize = async (args: { node: LNDNode }): Promise<any> => {
  const { ports, tlsPath, macaroonPath } = args.node;
  const config = {
    server: `127.0.0.1:${ports.grpc}`,
    tls: tlsPath,
    macaroonPath: macaroonPath,
  };
  nodes[args.node.name] = await createLndRpc(config);
  return { success: true };
};

/**
 * Calls the LND `getinfo` RPC command
 * @param args the name of the LND node
 */
const getInfo = async (args: { name: string }): Promise<GetInfoResponse> => {
  return await nodes[args.name].getInfo();
};

/**
 * A mapping of IPC channel names to the functions to execute when
 * messages are recieved
 */
const listeners: {
  [key: string]: (...args: any) => Promise<any>;
} = {
  initialize,
  'get-info': getInfo,
};

/**
 * Sets up the IPC listeners for the main process and maps them to async
 * functions.
 * @param ipc the IPC onject of the main process
 */
export const initLndProxy = (ipc: IpcMain) => {
  debug('LndProxy: initialize');
  Object.entries(listeners).forEach(([channel, func]) => {
    const reqChan = `lnd-${channel}-request`;
    const resChan = `lnd-${channel}-response`;

    debug(`listening for ipc command "${channel}"`);
    ipc.on(reqChan, async (event, ...args) => {
      debug(`LndProxy: received request "${reqChan}"`, ...args);
      try {
        const result = await func(...args);
        if (result) {
          debug(`LndProxy: send response "${resChan}"`, result);
          event.reply(resChan, result);
        }
      } catch (err) {
        debug(`LndProxy: send error "${resChan}"`, err);
        event.reply(resChan, { err: err.message });
      }
    });
  });
};
