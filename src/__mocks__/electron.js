module.exports = {
  remote: {
    app: {
      getPath: p => `ELECTRON_PATH[${p}]`,
      getLocale: () => 'en-US',
    },
  },
  ipcRenderer: {
    once: jest.fn(),
    send: jest.fn(),
  },
};
