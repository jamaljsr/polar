import { ipcRenderer, IpcRendererEvent } from 'electron';
import { debug } from 'electron-log';

export type IpcSender = <T>(channel: string, payload?: any) => Promise<T>;

/**
 * simple utility func to trim a lot of redundant node information being logged.
 * if the payload being sent over IPC contains a 'node' object, then replace it
 * with just the name of the node instead of the full object
 */
const stripNode = (payload: any) => {
  if (payload && payload.node) {
    return {
      ...payload,
      node: payload.node.name,
    };
  }
  return payload;
};

/**
 * A wrapper function to create an async function which sends messages over IPC and
 * returns the response via a promise
 * @param serviceName the name of of the channel that will be displayed in logs
 * @param prefix the prefix to use in the ipc messages
 */
export const createIpcSender = (serviceName: string, prefix: string) => {
  const send: IpcSender = (channel, payload) => {
    const reqChan = `${prefix}-${channel}-request`;
    const resChan = `${prefix}-${channel}-response`;
    // set the response channel dynamically to avoid race conditions
    // when multiple requests are in flight at the same time
    const uniqueness = Math.round(Math.random() * Date.now());
    debug('Payload: ', JSON.stringify(payload, null, 2));
    const uniqPayload = {
      ...payload,
      replyTo: `${resChan}-${uniqueness}`,
    };

    return new Promise((resolve, reject) => {
      ipcRenderer.once(uniqPayload.replyTo, (event: IpcRendererEvent, res: any) => {
        debug(
          `${serviceName}: [response] "${uniqPayload.replyTo}"`,
          JSON.stringify(res, null, 2),
        );
        if (res && res.err) {
          reject(new Error(res.err));
        } else {
          resolve(res);
        }
      });
      debug(
        `${serviceName}: [request] "${reqChan}"`,
        JSON.stringify(uniqPayload, null, 2),
      );
      ipcRenderer.send(reqChan, uniqPayload);
    });
  };

  return send;
};
