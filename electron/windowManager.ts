import { app, BrowserWindow, ipcMain } from 'electron';
import { warn } from 'electron-log';
import windowState from 'electron-window-state';
import { initAppIpcListener } from './appIpcListener';
import { BASE_URL, IS_DEV } from './constants';
import { clearProxyCache, initLndProxy } from './lnd/lndProxyServer';

class WindowManager {
  mainWindow: BrowserWindow | null = null;

  start() {
    app.on('ready', async () => {
      await this.createMainWindow();
      initLndProxy(ipcMain);
      initAppIpcListener(ipcMain);
    });
    app.on('window-all-closed', this.onAllClosed);
    app.on('activate', this.onActivate);
  }

  async createMainWindow() {
    const mainState = windowState({
      defaultWidth: 900,
      defaultHeight: 600,
      file: 'window-state-main.json',
    });

    this.mainWindow = new BrowserWindow({
      x: mainState.x,
      y: mainState.y,
      width: mainState.width,
      height: mainState.height,
      minWidth: 900,
      webPreferences: {
        nodeIntegration: true,
      },
    });
    this.mainWindow.removeMenu();

    if (IS_DEV) {
      await this.setupDevEnv();
    }

    this.mainWindow.on('closed', this.onMainClosed);

    // use dev server for hot reload or file in production
    this.mainWindow.loadURL(BASE_URL);

    // clear the proxy cached data if the window is reloaded
    this.mainWindow.webContents.on('did-finish-load', clearProxyCache);

    mainState.manage(this.mainWindow);
  }

  async setupDevEnv() {
    // install react & redux chrome dev tools
    const {
      default: install,
      REACT_DEVELOPER_TOOLS,
      REDUX_DEVTOOLS,
    } = require('electron-devtools-installer'); // eslint-disable-line @typescript-eslint/no-var-requires
    try {
      await install(REACT_DEVELOPER_TOOLS);
      await install(REDUX_DEVTOOLS);
    } catch (e) {
      warn('unable to install devtools', e);
    }
  }

  onMainClosed() {
    this.mainWindow = null;
  }

  onAllClosed() {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  }

  onActivate() {
    if (this.mainWindow === null) {
      this.createMainWindow();
    }
  }
}

export default WindowManager;
