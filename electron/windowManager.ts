import {
  app,
  BrowserWindow,
  ipcMain,
  Menu,
  nativeImage,
  nativeTheme,
  Tray,
} from 'electron';
import { error, warn } from 'electron-log';
import windowState from 'electron-window-state';
import { join } from 'path';
import { initAppIpcListener } from './appIpcListener';
import { appMenuTemplate } from './appMenu';
import { APP_ROOT, BASE_URL, IS_DEV } from './constants';
import {
  clearLndProxyCache,
  initLndProxy,
  initLndSubscriptions,
} from './lnd/lndProxyServer';
import { initTapdProxy } from './tapd/tapdProxyServer';

class WindowManager {
  mainWindow: BrowserWindow | null = null;
  tray: Tray | null = null;

  start() {
    app.on('ready', async () => {
      await this.createMainWindow();
      initLndProxy(ipcMain);
      initTapdProxy(ipcMain);
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
    if (!this.tray) {
      this.createAppTray();
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
    this.tray?.destroy();
    app.quit();
  }

  onAllClosed() {
    this.tray?.destroy();
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

  TRAY_ICONS_ROOT: string[] = [APP_ROOT, 'assets', 'icons', 'tray'];

  /**
   * select `light` or `dark` icon based on host OS
   * system theme
   * @param path
   * @returns
   */
  iconSelector = (path: 'quit' | 'minimize' | 'show') => {
    if (nativeTheme.shouldUseDarkColors) {
      let iconName;
      switch (process.platform) {
        case 'darwin':
          iconName = '16x16Template.png';
          break;
        case 'win32':
          iconName = '16x16icon-dark.png';
          break;
        case 'linux':
          iconName = '96x96icon-dark.png';
          break;
        default:
          iconName = '96x96icon-dark.png';
          break;
      }
      const imagePath = join(...this.TRAY_ICONS_ROOT, path, iconName);
      const nativeImageFromPath = nativeImage.createFromPath(imagePath);
      nativeImageFromPath.setTemplateImage(true);
      return nativeImageFromPath;
    }

    if (!nativeTheme.shouldUseDarkColors) {
      let iconName;
      switch (process.platform) {
        case 'darwin':
          iconName = '16x16Template.png';
          break;
        case 'win32':
          iconName = '16x16icon-light.png';
          break;
        case 'linux':
          iconName = '96x96icon-light.png';
          break;
        default:
          iconName = '96x96icon-light.png';
          break;
      }
      const imagePath = join(...this.TRAY_ICONS_ROOT, path, iconName);
      const nativeImageFromPath = nativeImage.createFromPath(imagePath);
      nativeImageFromPath.setTemplateImage(true);
      return nativeImageFromPath;
    }
  };

  /**
   * `hides` polar windows
   */
  handleOnHideClick = () => {
    app.dock?.hide();
    this.mainWindow?.setSkipTaskbar(true);
    this.mainWindow?.hide();
  };

  /**
   * `shows` polar window
   */
  handleOnShowClick = () => {
    app.dock?.show();
    this.mainWindow?.setSkipTaskbar(false);
    this.mainWindow?.show();
  };

  /**
   * closes all windows and quits the app
   */
  handleQuitClick = () => {
    app.quit();
  };

  updateTrayIcons(tray: Tray | null) {
    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Minimize Window',
        click: this.handleOnHideClick,
        icon: this.iconSelector('minimize'),
      },
      {
        label: 'Show Window',
        click: this.handleOnShowClick,
        icon: this.iconSelector('show'),
      },
      {
        type: 'separator',
      },
      {
        label: 'Quit Polar',
        click: this.handleQuitClick,
        icon: this.iconSelector('quit'),
      },
    ]);

    tray?.setContextMenu(contextMenu);
  }

  /**
   * Creates App tray icon with a menu of options
   * to `Hide/Show` the app window
   * and also `quite` the running app instance
   * @returns void
   */
  createAppTray() {
    const trayIcon =
      process.platform === 'darwin'
        ? join(...this.TRAY_ICONS_ROOT, '16x16Template.png')
        : join(...this.TRAY_ICONS_ROOT, '1024x1024-white.png');
    const nativeImageFromPath = nativeImage.createFromPath(trayIcon as string);
    nativeImageFromPath.setTemplateImage(true);
    this.tray = new Tray(nativeImageFromPath);

    // initial creation of tray menu
    this.updateTrayIcons(this.tray);

    nativeTheme.on('updated', () => {
      // re-create tray context menu when system theme changes
      this.updateTrayIcons(this?.tray);
    });
  }
}

export default WindowManager;
