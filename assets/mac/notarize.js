/* eslint-disable @typescript-eslint/no-var-requires */
const { notarize } = require('electron-notarize');

const _default = async function notarizing(context) {
  const { electronPlatformName, appOutDir } = context;
  if (electronPlatformName !== 'darwin') {
    return;
  }
  const appName = context.packager.appInfo.productFilename;
  return await notarize({
    appBundleId: 'com.polarlightning.app',
    appPath: `${appOutDir}/${appName}.app`,
    appleId: process.env.APPLE_DEV_USER,
    appleIdPassword: process.env.APPLE_DEV_PASS,
  });
};
module.exports = _default;
