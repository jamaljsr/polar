import { remove } from 'fs-extra';
import { join } from 'path';
import { homedir, platform } from 'os';
import { ClientFunction } from 'testcafe';

export const pageUrl = '../build/index.html';

export const getPageUrl = ClientFunction(() => window.location.href);
export const getPageTitle = ClientFunction(() => document.title);

export const assertNoConsoleErrors = async (t: TestController) => {
  const { error } = await t.getBrowserConsoleMessages();
  await t.expect(error).eql([]);
};

const appDataPaths = {
  win32: join(homedir(), 'AppData', 'Roaming'),
  darwin: join(homedir(), 'Library', 'Application Support'),
  linux: join(homedir(), '.config'),
};
export const cleanup = async () => {
  const appDataPath = process.env['APPDATA'] || appDataPaths[platform()];
  const dataPath = join(appDataPath, 'Electron', 'data');
  await remove(dataPath);
};
