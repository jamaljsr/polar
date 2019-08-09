import { getPageTitle, assertNoConsoleErrors, pageUrl } from './helpers';

fixture`App`.page(pageUrl).afterEach(assertNoConsoleErrors);

test('should have correct title', async t => {
  await t.expect(getPageTitle()).eql('React App');
});
