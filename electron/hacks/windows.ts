// Work-around for this Electron bug: https://github.com/electron/electron/issues/19468

import { app } from 'electron';
import { execSync } from 'child_process';

function setWindowsAppTheme(light: boolean) {
  try {
    execSync(
      `REG ADD HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize /v AppsUseLightTheme /t REG_DWORD /d ${
        light ? 1 : 0
      } /f`,
      { windowsHide: true },
    );
  } catch (error) {
    throw new Error(
      'No permission to modify AppsUseLightTheme value. Electron will hang.',
    );
  }
}

// Validates that reg value exists and is set to 1
function isCurrentAppThemeLight(): boolean {
  let result: string | RegExpMatchArray | null | number;
  try {
    // Check if value exists in registry
    result = execSync(
      'REG QUERY HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize /v AppsUseLightTheme /t REG_DWORD',
      { encoding: 'utf8', windowsHide: true },
    );
  } catch (error) {
    // Value doesn't exist.
    throw new Error('Could not find registry value');
  }
  result = result.match(/0x\d+$/im);
  if (result === null) throw new Error('Unexpected output from reg.exe');
  result = parseInt(result[0], 16);
  if (isNaN(result)) throw new Error('Unexpected output from reg.exe');
  return result === 1;
}

let hasBeenCalled = false;

export const initWindowsDarkHack = (): boolean => {
  if (hasBeenCalled) return false;
  hasBeenCalled = true;

  // This workaround does not apply to anything but Windows.
  if (process.platform !== 'win32') return false;
  try {
    if (isCurrentAppThemeLight()) return false;
  } catch (error) {
    // Unsupported Windows version.
    return false;
  }

  app.on('will-finish-launching', () => {
    setWindowsAppTheme(true);
  });

  app.on('ready', () => {
    setWindowsAppTheme(false);
  });

  return true;
};
