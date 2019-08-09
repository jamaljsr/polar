import { App, Counter } from './pages';
import { assertNoConsoleErrors, pageUrl, getPageUrl } from './helpers';

fixture`Counter`
  .page(pageUrl)
  .beforeEach(App.clickCounterLink)
  .afterEach(assertNoConsoleErrors);

test('should be on the route /counter', async t => {
  await t.expect(getPageUrl()).match(/.*#\/counter$/);
});

test('should display updated count after increment button click', async t => {
  await t
    .click(Counter.increment)
    .expect(Counter.getCounterText())
    .eql('1');
});

test('should display updated count after decrement button click', async t => {
  await t
    .click(Counter.decrement)
    .expect(Counter.getCounterText())
    .eql('-1');
});

test('should not change when count is even and odd button clicked', async t => {
  await t
    .click(Counter.incrementOdd)
    .expect(Counter.getCounterText())
    .eql('0');
});

test('should change when count is odd and odd button clicked', async t => {
  await t
    .click(Counter.increment)
    .click(Counter.incrementOdd)
    .expect(Counter.getCounterText())
    .eql('3');
});

test('should change a second later if async button clicked', async t => {
  await t
    .click(Counter.incrementAsync)
    .expect(Counter.loadingIcon)
    .ok()
    .expect(Counter.getCounterText())
    .eql('1');
});

test('should show error if count is 3 and async button clicked', async t => {
  await t
    .click(Counter.increment) // increment to 1
    .click(Counter.incrementOdd) // increment to 3
    .click(Counter.incrementAsync)
    .expect(Counter.loadingIcon.exists)
    .ok()
    .expect(Counter.getCounterText())
    .eql('3')
    .expect(Counter.error.exists)
    .ok()
    .expect(Counter.getErrorText())
    .eql('Increment Async prohibited when count is 3.');
});
