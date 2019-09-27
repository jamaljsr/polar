import { app, BrowserWindow, ipcMain } from 'electron';
import electronDebug from 'electron-debug';
import isNotPackaged from 'electron-is-dev';
import { debug } from 'electron-log';
import windowState from 'electron-window-state';
import path from 'path';
import { initLndProxy } from './lnd/lndProxy';

const isDev = isNotPackaged && process.env.NODE_ENV !== 'production';
debug(`Starting Electron main process`);

let mainWindow: BrowserWindow | null;

// use dev server for hot reload or file in production
const url = isDev
  ? 'http://localhost:3000'
  : `file://${path.join(__dirname, '../build/index.html')}`;

// install react & redux chrome dev tools
const installExtensions = async () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS', 'REDUX_DEVTOOLS'];

  return Promise.all(
    extensions.map(name => installer.default(installer[name], forceDownload)),
  ).catch(debug);
};

const createWindow = async () => {
  const mainState = windowState({
    defaultWidth: 900,
    defaultHeight: 600,
  });

  mainWindow = new BrowserWindow({
    x: mainState.x,
    y: mainState.y,
    width: mainState.width,
    height: mainState.height,
    minWidth: 781,
    webPreferences: {
      nodeIntegration: true,
    },
  });

  mainState.manage(mainWindow);

  mainWindow.loadURL(url);

  if (isDev) {
    electronDebug();
    await installExtensions();
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => (mainWindow = null));
};

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

initLndProxy(ipcMain);
