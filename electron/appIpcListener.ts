import { app, BrowserWindow, IpcMain } from 'electron';
import { debug } from 'electron-log';
import windowState from 'electron-window-state';
import { join } from 'path';
import { ipcChannels } from '../src/shared';
import { APP_ROOT, BASE_URL } from './constants';
import { httpProxy } from './httpProxy';
import { clearLitdProxyCache } from './litd/litdProxyServer';
import { clearLndProxyCache } from './lnd/lndProxyServer';
import { clearTapdProxyCache } from './tapd/tapdProxyServer';
import { unzip, zip } from './utils/zip';

const openWindow = async (args: { url: string }): Promise<boolean> => {
  debug('openWindow', args);
  const winState = windowState({
    defaultWidth: 800,
    defaultHeight: 600,
    file: `${args.url.replace(/\//g, '_')}.json`,
    path: join(app.getPath('userData'), 'window-state'),
  });
  let window: BrowserWindow | null = new BrowserWindow({
    x: winState.x,
    y: winState.y,
    width: winState.width,
    height: winState.height,
    minWidth: 400,
    icon: join(APP_ROOT, 'assets', 'icon.png'),
    show: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
    },
  });
  window.setMenuBarVisibility(false);
  window.on('closed', () => {
    window = null;
  });
  window.once('ready-to-show', () => {
    if (window) window.show();
  });

  await window.loadURL(`${BASE_URL}#${args.url}`);

  winState.manage(window);

  return true;
};

/**
 * Clears the LND proxy cache of LND nodes. This must return a promise to be
 * consistent with all the other listeners
 */
const clearCache = (): Promise<{ success: boolean }> => {
  clearLndProxyCache();
  clearTapdProxyCache();
  clearLitdProxyCache();
  return Promise.resolve({ success: true });
};

/**
 * A mapping of electron IPC channel names to the functions to execute when
 * messages are received
 */
const listeners: {
  [key: string]: (...args: any) => Promise<any>;
} = {
  [ipcChannels.openWindow]: openWindow,
  [ipcChannels.clearCache]: clearCache,
  [ipcChannels.http]: httpProxy,
  [ipcChannels.zip]: zip,
  [ipcChannels.unzip]: unzip,
};

/**
 * Sets up the IPC listeners for the main process and maps them to async
 * functions.
 * @param ipc the IPC object of the main process
 */
export const initAppIpcListener = (ipc: IpcMain) => {
  const log = (msg: string, ...rest: any[]) => debug(`AppIpcListener: ${msg}`, ...rest);
  Object.entries(listeners).forEach(([channel, func]) => {
    const requestChan = `app-${channel}-request`;
    const responseChan = `app-${channel}-response`;

    log(`listening for ipc command "${channel}"`);
    ipc.on(requestChan, async (event, ...args) => {
      // the a message is received by the main process...
      log(`received request "${requestChan}"`, JSON.stringify(args, null, 2));
      // inspect the first arg to see if it has a specific channel to reply to
      let uniqueChan = responseChan;
      if (args && args[0] && args[0].replyTo) {
        uniqueChan = args[0].replyTo;
      }
      try {
        // attempt to execute the associated function
        const result = await func(...args);
        // merge the result with default values since LND omits falsey values
        log(`send response "${uniqueChan}"`, JSON.stringify(result, null, 2));
        // response to the calling process with a reply
        event.reply(uniqueChan, result);
      } catch (err: any) {
        // reply with an error message if the execution fails
        log(`send error "${uniqueChan}"`, JSON.stringify(err, null, 2));
        event.reply(uniqueChan, { err: err.message });
      }
    });
  });
};
