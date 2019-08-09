import path from 'path';
import { app, BrowserWindow } from 'electron';
import debug from 'electron-debug';
import isNotPackaged from 'electron-is-dev';
import { warn } from 'electron-log';

const isDev = isNotPackaged && process.env.NODE_ENV !== 'production';
warn(`Starting Electron main process`);

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
  ).catch(console.log);
};

const createWindow = async () => {
  mainWindow = new BrowserWindow({
    width: isDev ? 1536 : 900,
    height: 680,
    webPreferences: {
      nodeIntegration: true,
    },
  });

  mainWindow.loadURL(url);

  if (isDev) {
    debug();
    await installExtensions();
    mainWindow.webContents.openDevTools();
    mainWindow.maximize();
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
