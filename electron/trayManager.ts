import { app, BrowserWindow, Menu, nativeImage, nativeTheme, Tray } from 'electron';
import { join } from 'path';
import { APP_ROOT } from './constants';

const TRAY_ICONS_ROOT = join(APP_ROOT, 'assets', 'icons', 'tray');

export default class TrayManager {
  mainWindow: BrowserWindow;
  tray: Tray;

  /** The current system theme */
  get theme(): 'light' | 'dark' {
    return nativeTheme.shouldUseDarkColors ? 'dark' : 'light';
  }

  /** The name of the tray icon file based on the platform and theme */
  get trayIconName(): string {
    switch (process.platform) {
      case 'darwin':
        return '16x16Template.png';
      case 'linux':
        // The linux tray background doesn't change with the theme. It's always dark
        // on Ubuntu and always light on Mint. We use the dark icon for both. This may
        // be fixable in the future, but there's no good solution right now.
        return `1024x1024-dark.png`;
      default:
        return `1024x1024-${this.theme}.png`;
    }
  }

  /** The name of the menu icon file based on the platform and theme */
  get menuIconName(): string {
    switch (process.platform) {
      case 'darwin':
        return '16x16Template.png';
      case 'win32':
        return `16x16icon-${this.theme}.png`;
      case 'linux':
        return `96x96icon-${this.theme}.png`;
      default:
        return `96x96icon-${this.theme}.png`;
    }
  }

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow;

    this.tray = new Tray(this.getIconPath('tray'));

    // initial creation of tray menu
    this.updateTrayIcons();

    if (process.platform !== 'darwin') {
      this.tray.on('click', () => {
        // show the window when the user clicks on the tray icon
        this.handleOnShowClick();
      });
    }

    nativeTheme.on('updated', () => {
      // re-create tray context menu when system theme changes
      this.updateTrayIcons();
    });
  }

  /**
   * Gets the full path to the menu icon based on platform and theme
   */
  getIconPath(name: 'tray' | 'quit' | 'minimize' | 'show') {
    const imagePath =
      name === 'tray'
        ? join(TRAY_ICONS_ROOT, this.trayIconName)
        : join(TRAY_ICONS_ROOT, name, this.menuIconName);

    const image = nativeImage.createFromPath(imagePath);
    image.setTemplateImage(true);
    return image;
  }

  /**
   * Updates the tray context menu icons based on the current theme
   */
  updateTrayIcons() {
    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Minimize Window',
        click: this.handleOnHideClick,
        icon: this.getIconPath('minimize'),
      },
      {
        label: 'Show Window',
        click: this.handleOnShowClick,
        icon: this.getIconPath('show'),
      },
      {
        type: 'separator',
      },
      {
        label: 'Quit Polar',
        click: this.handleQuitClick,
        icon: this.getIconPath('quit'),
      },
    ]);

    this.tray.setContextMenu(contextMenu);
    this.tray.setImage(this.getIconPath('tray'));
  }

  /**
   * Hides the main window
   */
  handleOnHideClick = () => {
    app.dock?.hide();
    this.mainWindow.setSkipTaskbar(true);
    this.mainWindow.hide();
  };

  /**
   * Shows the main window
   */
  handleOnShowClick = () => {
    app.dock?.show();
    this.mainWindow.setSkipTaskbar(false);
    this.mainWindow.show();
  };

  /**
   * Closes all windows and quits the app
   */
  handleQuitClick = () => {
    app.quit();
  };

  destroy() {
    this.tray.destroy();
  }
}
