import { ipcRenderer, IpcRendererEvent } from 'electron';
import { debug } from 'electron-log';
import { toJSON } from 'shared/utils';

export type IpcSender = <T>(channel: string, payload?: any) => Promise<T>;

export type IpcStreamEvent = IpcRendererEvent;
export type IpcStreamCallback = (event: IpcStreamEvent, res: any) => void;

export type IpcStreamer = {
  subscribe: (channel: string, payload: any, callback: IpcStreamCallback) => void;
  unsubscribe: (channel: string, callback: IpcStreamCallback) => void;
};

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
    const uniqPayload = {
      ...payload,
      replyTo: `${resChan}-${uniqueness}`,
    };

    return new Promise((resolve, reject) => {
      ipcRenderer.once(uniqPayload.replyTo, (event: IpcRendererEvent, res: any) => {
        debug(`${serviceName}: [response] "${uniqPayload.replyTo}"`, toJSON(res));
        if (res && res.err) {
          reject(new Error(res.err));
        } else {
          resolve(res);
        }
      });
      debug(`${serviceName}: [request] "${reqChan}"`, toJSON(stripNode(uniqPayload)));
      ipcRenderer.send(reqChan, uniqPayload);
    });
  };

  return send;
};

export const createIpcStreamer = (serviceName: string, prefix: string): IpcStreamer => {
  const subscribe = (channel: string, payload: any, callback: IpcStreamCallback) => {
    const reqChan = `${prefix}-${channel}-request`;
    const subChan = `${prefix}-${channel}-stream`;
    // set the response channel dynamically to avoid race conditions
    // when multiple requests are in flight at the same time
    const uniqueness = Math.round(Math.random() * Date.now());
    const uniqPayload = {
      ...payload,
      replyTo: `${subChan}-${uniqueness}`,
    };

    // subscribe to the ipc channel and listen for the response
    debug(`${serviceName}: [subscribe] "${subChan}"`);
    ipcRenderer.on(uniqPayload.replyTo, callback);

    // send the request to the main process
    debug(`${serviceName}: [request] "${reqChan}"`, toJSON(stripNode(uniqPayload)));
    ipcRenderer.send(reqChan, uniqPayload);
  };

  const unsubscribe = (channel: string, callback: IpcStreamCallback) => {
    const subChan = `${prefix}-${channel}-stream`;
    debug(`${serviceName}: [unsubscribe] "${subChan}"`);
    ipcRenderer.off(subChan, callback);
  };

  return { subscribe, unsubscribe };
};
