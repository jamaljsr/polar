import { Home } from './pages';
import { getPageUrl, assertNoConsoleErrors, pageUrl } from './helpers';

fixture`Home`.page(pageUrl).afterEach(assertNoConsoleErrors);

test('should be on the route /', async t => {
  await t.expect(getPageUrl()).match(/.*#\/$/);
});

test('should show success alert when "Click Me" button clicked', async t => {
  await t
    .click(Home.clickMeButton)
    .expect(Home.successAlert.exists)
    .ok();
});

test('should navgiate to /counter', async t => {
  await t
    .click(Home.counterLink)
    .expect(getPageUrl())
    .contains('/counter');
});
