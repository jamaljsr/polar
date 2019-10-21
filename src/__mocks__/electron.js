module.exports = {
  remote: {
    app: {
      getPath: p => `ELECTRON_PATH[${p}]`,
      getLocale: () => 'en-US',
    },
    process: {
      env: {},
    },
  },
  ipcRenderer: {
    once: jest.fn(),
    send: jest.fn(),
  },
};
