import { App, NewNetwork } from './pages';
import { assertNoConsoleErrors, pageUrl, getPageUrl } from './helpers';

fixture`NewNetwork`
  .page(pageUrl)
  .beforeEach(App.clickNewNetworkBtn)
  .afterEach(assertNoConsoleErrors);

test('should be on the route /network', async t => {
  await t.expect(getPageUrl()).match(/.*#\/network$/);
});

test('should add a new network', async t => {
  await t
    .typeText(NewNetwork.nameInput, 'test network')
    .click(NewNetwork.submitBtn)
    .expect(getPageUrl())
    .match(/.*#\/$/)
    .expect(NewNetwork.getNotificationText())
    .eql('Created network: test network');
});
