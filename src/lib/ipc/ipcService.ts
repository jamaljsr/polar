import { ipcRenderer, IpcRendererEvent } from 'electron';
import { debug } from 'electron-log';

export type IpcSender = <T>(channel: string, payload?: any) => Promise<T>;

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
        debug(
          `${serviceName}: received response "${uniqPayload.replyTo}"`,
          JSON.stringify(res, null, 2),
        );
        if (res && res.err) {
          reject(new Error(res.err));
        } else {
          resolve(res);
        }
      });
      debug(
        `${serviceName}: send request "${reqChan}"`,
        JSON.stringify(uniqPayload, null, 2),
      );
      ipcRenderer.send(reqChan, uniqPayload);
    });
  };

  return send;
};
