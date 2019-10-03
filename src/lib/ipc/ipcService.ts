import { ipcRenderer, IpcRendererEvent } from 'electron';

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
    // TODO: set the response channel dynamically to avoid race conditions
    // when multiple requests are in flight
    const resChan = `${prefix}-${channel}-response`;

    return new Promise((resolve, reject) => {
      ipcRenderer.once(resChan, (event: IpcRendererEvent, args: any) => {
        if (args.err) {
          reject(new Error(args.err));
        } else {
          resolve(args);
        }
      });
      ipcRenderer.send(reqChan, payload);
    });
  };

  return send;
};
