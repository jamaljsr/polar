import { App, NewNetwork, NetworkView } from './pages';
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
    .expect(NewNetwork.getNotificationText())
    .eql('Created network: test network');
});

test('should should view new network after adding', async t => {
  await t
    .typeText(NewNetwork.nameInput, 'test network')
    .click(NewNetwork.submitBtn)
    .expect(getPageUrl())
    .match(/.*#\/network\/1$/);
});

test('should display new network in the network list', async t => {
  await t
    .typeText(NewNetwork.nameInput, 'test network')
    .click(NewNetwork.submitBtn)
    .expect(App.getFirstNetworkText())
    .eql('test network');
});

test('should display correct # of LND nodes after adding', async t => {
  await t
    .typeText(NewNetwork.nameInput, 'test network')
    .selectText(NewNetwork.lndNodesInput)
    .typeText(NewNetwork.lndNodesInput, '3')
    .click(NewNetwork.submitBtn)
    .expect(NetworkView.getLndNodeCount())
    .eql(3);
});

test('should display correct # of bitcoind nodes after adding', async t => {
  await t
    .typeText(NewNetwork.nameInput, 'test network')
    .click(NewNetwork.submitBtn)
    .expect(NetworkView.getBitcoindNodeCount())
    .eql(1);
});
