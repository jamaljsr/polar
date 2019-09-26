import { IpcMain } from 'electron';
import { debug } from 'electron-log';
import createLndRpc, { LnRpc, LnRpcClientConfig } from '@radar/lnrpc';
import { LNDNode } from '../types';

const nodes: {
  [key: string]: LnRpc;
} = {};

const connect = async (args: {
  node: LNDNode;
  config: LnRpcClientConfig;
}): Promise<any> => {
  nodes[args.node.name] = await createLndRpc(args.config);
  return { success: true };
};

const getInfo = async (args: { name: string }): Promise<any> => {
  return await nodes[args.name].getInfo();
};

/**
 * A mapping of IPC channel names to the functions to execute when
 * messages are recieved
 */
const listeners: {
  [key: string]: (...args: any) => Promise<any>;
} = {
  connect,
  'get-info': getInfo,
};

/**
 * Sets up the IPC listeners for the main process and maps them to async
 * functions.
 * @param ipc the IPC onject of the main process
 */
export const initLndProxy = (ipc: IpcMain) => {
  debug('LndProxy: init');
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
