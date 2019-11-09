import os from 'os';

export type PolarPlatform = 'mac' | 'windows' | 'linux' | 'unknown';

/**
 * A wrapper function to simplify os detection throughout the app
 */
export const getPolarPlatform = () => {
  switch (os.platform()) {
    case 'darwin':
      return 'mac';
    case 'win32':
      return 'windows';
    case 'linux':
      return 'linux';
    default:
      return 'unknown';
  }
};

const is = (p: PolarPlatform) => p === getPolarPlatform();

export const isMac = () => is('mac');

export const isWindows = () => is('windows');

export const isLinux = () => is('linux');
