import { app, BrowserWindow, ipcMain } from 'electron';
import windowState from 'electron-window-state';
import { join } from 'path';
import { initLndProxy } from './lnd/lndProxy';

const devUrl = 'http://localhost:3000';
const prodUrl = `file://${join(__dirname, '../../build/index.html')}`;

class WindowManager {
  mainWindow: BrowserWindow | null = null;
  isDev: boolean;

  constructor(isDev: boolean) {
    this.isDev = isDev;
  }

  start() {
    app.on('ready', () => {
      this.createWindow();
      initLndProxy(ipcMain);
    });
    app.on('window-all-closed', this.onAllClosed);
    app.on('activate', this.onActivate);
  }

  async createWindow() {
    const mainState = windowState({
      defaultWidth: 900,
      defaultHeight: 600,
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

    if (this.isDev) {
      this.setupDevEnv();
    }

    this.mainWindow.on('closed', this.onMainClosed);

    // use dev server for hot reload or file in production
    this.mainWindow.loadURL(this.isDev ? devUrl : prodUrl);

    mainState.manage(this.mainWindow);
  }

  async setupDevEnv() {
    // install react & redux chrome dev tools
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const installer = require('electron-devtools-installer');

    await installer.default('REACT_DEVELOPER_TOOLS');
    await installer.default('REDUX_DEVTOOLS');
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
      this.createWindow();
    }
  }
}

export default WindowManager;
