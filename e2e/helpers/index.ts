import { remove } from 'fs-extra';
import { ClientFunction } from 'testcafe';
import { networksPath } from '../../src/utils/config';

export const pageUrl = '../build/index.html';

export const getPageUrl = ClientFunction(() => window.location.href);
export const getPageTitle = ClientFunction(() => document.title);

export const assertNoConsoleErrors = async (t: TestController) => {
  const { error } = await t.getBrowserConsoleMessages();
  await t.expect(error).eql([]);
};

export const cleanup = async () => {
  await remove(networksPath);
};
