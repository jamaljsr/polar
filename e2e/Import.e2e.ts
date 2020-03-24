import { assertNoConsoleErrors, cleanup, getPageUrl, pageUrl } from './helpers';
import { Home } from './pages';

fixture`Import`
  .page(pageUrl)
  .beforeEach(Home.clickImportButton)
  .afterEach(assertNoConsoleErrors)
  .afterEach(cleanup);

test('should be on the import network route', async t => {
  await t.expect(getPageUrl()).match(/network_import/);
});
