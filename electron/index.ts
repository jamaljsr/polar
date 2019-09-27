import electronDebug from 'electron-debug';
import isNotPackaged from 'electron-is-dev';
import { debug } from 'electron-log';
import WindowManager from './windowManager';

const isDev = isNotPackaged && process.env.NODE_ENV !== 'production';
// disable the Electron Security Warnings shown when access the dev url
process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = `${isDev}`;

debug(`Starting Electron main process`);

// add keyboard shortcuts and auto open dev tools for all windows
electronDebug();

const windowManager = new WindowManager(isDev);
windowManager.start();
