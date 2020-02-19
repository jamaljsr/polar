import { tmpdir } from 'os';
import { join } from 'path';

module.exports = {
  remote: {
    app: {
      getPath: p => `ELECTRON_PATH[${p}]`,
      getLocale: () => 'en-US',
    },
    dialog: {
      showSaveDialog: async () => ({
        filePath: join(tmpdir(), 'polar-saved-network.zip'),
      }),
    },
    process: {
      env: {},
    },
  },
  ipcRenderer: {
    once: jest.fn(),
    send: jest.fn(),
  },
  shell: {
    openExternal: jest.fn(),
  },
};
