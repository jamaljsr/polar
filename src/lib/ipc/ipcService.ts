import { ipcRenderer, IpcRendererEvent } from 'electron';
import { debug } from 'electron-log';

export type IcpSender = <T>(channel: string, payload?: any) => Promise<T>;

/**
 * A wrapper function to create an async function which sends messages over IPC and
 * returns the response via a promise
 * @param serviceName the name of of the channel that will be displayed in logs
 * @param prefix the prefix to use in the ipc messages
 */
export const createIpcSender = (serviceName: string, prefix: string) => {
  const send: IcpSender = (channel, payload) => {
    const reqChan = `${prefix}-${channel}-request`;
    const resChan = `${prefix}-${channel}-response`;

    return new Promise((resolve, reject) => {
      ipcRenderer.once(resChan, (event: IpcRendererEvent, args: any) => {
        debug(`${serviceName}: receive response "${resChan}"`, args);
        if (args.err) {
          reject(new Error(args.err));
        } else {
          resolve(args);
        }
      });
      debug(`${serviceName}: send request "${reqChan}"`, payload);
      ipcRenderer.send(reqChan, payload);
    });
  };

  return send;
};
