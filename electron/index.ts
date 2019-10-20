import electronDebug from 'electron-debug';
import isNotPackaged from 'electron-is-dev';
import { debug, error } from 'electron-log';
import { sync } from 'shell-env';
import WindowManager from './windowManager';

const isDev = isNotPackaged && process.env.NODE_ENV !== 'production';
// disable the Electron Security Warnings shown when access the dev url
process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = `${isDev}`;

debug(`Starting Electron main process`);

// add keyboard shortcuts and auto open dev tools for all windows
electronDebug({ isEnabled: isDev });

// merge in env vars from the user's shell (i.e. PATH) so that
// docker commands can be executed
process.env = {
  ...process.env,
  ...sync(),
};

try {
  const windowManager = new WindowManager(isDev);
  windowManager.start();
} catch (e) {
  error('Unable to start WindowManager', e);
}
