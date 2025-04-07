import { app, BrowserWindow, ipcMain, Menu } from 'electron';
import { error, warn } from 'electron-log';
import windowState from 'electron-window-state';
import { join } from 'path';
import { initAppIpcListener } from './appIpcListener';
import { appMenuTemplate } from './appMenu';
import { APP_ROOT, BASE_URL, IS_DEV } from './constants';
import { initLitdProxy } from './litd/litdProxyServer';
import {
  clearLndProxyCache,
  initLndProxy,
  initLndSubscriptions,
} from './lnd/lndProxyServer';
import { initTapdProxy } from './tapd/tapdProxyServer';
import TrayManager from './trayManager';

class WindowManager {
  mainWindow: BrowserWindow | null = null;
  trayManager: TrayManager | null = null;

  start() {
    app.on('ready', async () => {
      await this.createMainWindow();
      initLndProxy(ipcMain);
      initTapdProxy(ipcMain);
      initLitdProxy(ipcMain);
      initAppIpcListener(ipcMain);
      initLndSubscriptions(this.sendMessageToRenderer);
    });
    app.on('window-all-closed', this.onAllClosed);
    app.on('activate', this.onActivate);
  }

  async createMainWindow() {
    const menu = Menu.buildFromTemplate(appMenuTemplate());
    Menu.setApplicationMenu(menu);

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
      icon: join(APP_ROOT, 'assets', 'icon.png'),
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
        enableRemoteModule: true,
      },
    });

    // create App system tray icon with context menus
    if (!this.trayManager) {
      this.trayManager = new TrayManager(this.mainWindow);
    }

    this.mainWindow.setMenuBarVisibility(false);

    if (IS_DEV) {
      await this.setupDevEnv();
    }
    this.mainWindow.on('close', e => {
      e.preventDefault();
      this.onMainWindowClose();
    });
    this.mainWindow.on('closed', this.onMainClosed);

    ipcMain.on('docker-shut-down', this.onDockerContainerShutdown);

    // use dev server for hot reload or file in production
    this.mainWindow.loadURL(BASE_URL);

    // clear the proxy cached data if the window is reloaded
    this.mainWindow.webContents.on('did-finish-load', clearLndProxyCache);

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
    this.trayManager?.destroy();
    app.quit();
  }

  onAllClosed() {
    this.trayManager?.destroy();
    app.quit();
  }

  onMainWindowClose() {
    if (this.mainWindow) {
      this.mainWindow.webContents.send('app-closing');
    }
  }
  onDockerContainerShutdown() {
    this.mainWindow = null;
    app.exit(0);
  }

  onActivate() {
    if (this.mainWindow === null) {
      this.createMainWindow();
    }
  }

  sendMessageToRenderer = (responseChan: string, message: any) => {
    if (this.mainWindow && this.mainWindow.webContents) {
      this.mainWindow.webContents.send(responseChan, message);
    } else {
      error(`unable to send message ${message} to renderer on channel ${responseChan}`);
    }
  };
}

export default WindowManager;
