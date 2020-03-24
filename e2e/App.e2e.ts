import { assertNoConsoleErrors, cleanup, getPageTitle, pageUrl } from './helpers';

fixture`App`.page(pageUrl).afterEach(assertNoConsoleErrors).afterEach(cleanup);

test('should have correct title', async t => {
  await t.expect(getPageTitle()).eql('Polar');
});
