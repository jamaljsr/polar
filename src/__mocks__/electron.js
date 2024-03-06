module.exports = {
  remote: {
    app: {
      getPath: p => `ELECTRON_PATH[${p}]`,
      getLocale: () => 'en-US',
    },
    dialog: {
      showSaveDialog: jest.fn(),
    },
    Menu: {
      buildFromTemplate: jest.fn(),
    },
    process: {
      env: {},
    },
  },
  ipcRenderer: {
    once: jest.fn(),
    send: jest.fn(),
    on: jest.fn(),
    removeAllListeners: jest.fn(),
  },
  shell: {
    openExternal: jest.fn(),
  },
};
