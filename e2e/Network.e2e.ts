import { assertNoConsoleErrors, cleanup, getPageUrl, pageUrl } from './helpers';
import { Home, NetworkView, NewNetwork } from './pages';

fixture`Network`
  .page(pageUrl)
  .beforeEach(Home.clickCreateButton)
  .afterEach(assertNoConsoleErrors)
  .afterEach(cleanup);

test('should be on the New Network route', async t => {
  await t.expect(getPageUrl()).match(/.*#\/network$/);
});

test('should add a new network', async t => {
  await t
    .typeText(NewNetwork.nameInput, 'test network')
    .click(NewNetwork.submitBtn)
    .expect(NetworkView.getHeadingTitleText())
    .eql('test network');
});

test('should view new network after adding', async t => {
  await t
    .typeText(NewNetwork.nameInput, 'test network')
    .click(NewNetwork.submitBtn)
    .expect(getPageUrl())
    .match(/.*#\/network\/1$/);
});

test('should display all LND nodes after adding', async t => {
  await t
    .typeText(NewNetwork.nameInput, 'test network')
    .selectText(NewNetwork.lndNodesInput)
    .typeText(NewNetwork.lndNodesInput, '3')
    .click(NewNetwork.submitBtn)
    .expect(NetworkView.aliceNode())
    .ok()
    .expect(NetworkView.bobNode())
    .ok()
    .expect(NetworkView.carolNode())
    .ok();
});

test('should display the backend node after adding', async t => {
  await t
    .typeText(NewNetwork.nameInput, 'test network')
    .click(NewNetwork.submitBtn)
    .expect(NetworkView.backendNode())
    .ok();
});
