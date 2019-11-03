import electronDebug from 'electron-debug';
import { debug, error } from 'electron-log';
import { sync } from 'shell-env';
import { IS_DEV } from './constants';
import WindowManager from './windowManager';

// disable the Electron Security Warnings shown when access the dev url
process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = `${IS_DEV}`;

debug(`Starting Electron main process`);

// add keyboard shortcuts and auto open dev tools for all windows
electronDebug({ isEnabled: IS_DEV });

// merge in env vars from the user's shell (i.e. PATH) so that
// docker commands can be executed
process.env = {
  ...process.env,
  ...sync(),
};

try {
  const windowManager = new WindowManager();
  windowManager.start();
} catch (e) {
  error('Unable to start WindowManager', e);
}
