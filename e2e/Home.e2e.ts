import { assertNoConsoleErrors, cleanup, getPageUrl, pageUrl } from './helpers';
import { App, Home, NewNetwork } from './pages';

fixture`Home`
  .page(pageUrl)
  .afterEach(assertNoConsoleErrors)
  .afterEach(cleanup);

test('should be on the home screen route', async t => {
  await t.expect(getPageUrl()).match(/.*#\/$/);
});

test('should navgiate to New Network screen when create button clicked', async t => {
  await t
    .click(Home.createButton)
    .expect(getPageUrl())
    .contains('/network');
});

test('should navigate to network view when a card is clicked', async t => {
  await t
    .click(Home.createButton)
    .typeText(NewNetwork.nameInput, 'test network')
    .click(NewNetwork.submitBtn)
    .click(App.logoLink)
    .click(Home.getCardTitleWithText('test network'))
    .expect(getPageUrl())
    .contains('/network/1');
});
