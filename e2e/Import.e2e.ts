import { setElectronDialogHandler } from 'testcafe-browser-provider-electron';
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

test('when the user aborts the file dialog, nothing should happen', async t => {
  let dialogOpened = false;
  await setElectronDialogHandler(
    type => {
      if (type === 'save-dialog' || type === 'open-dialog') {
        dialogOpened = true;
        return undefined;
      }
      return;
    },
    { dialogOpened },
  );

  // to make our input clickable in Testcafe we have to make it visible
  await t.eval(() => {
    const input = window.document.querySelector('input');
    input.style.display = '';
    return;
  });

  return t
    .click('input')
    .expect(dialogOpened)
    .ok();
});
