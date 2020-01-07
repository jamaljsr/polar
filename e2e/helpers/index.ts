import { remove } from 'fs-extra';
import { join } from 'path';
import { homedir } from 'os';
import { ClientFunction } from 'testcafe';

export const pageUrl = '../build/index.html';

export const getPageUrl = ClientFunction(() => window.location.href);
export const getPageTitle = ClientFunction(() => document.title);

export const assertNoConsoleErrors = async (t: TestController) => {
  const { error } = await t.getBrowserConsoleMessages();
  await t.expect(error).eql([]);
};

export const cleanup = async () => {
  await remove(join(homedir(), '.polar', 'networks'));
};
