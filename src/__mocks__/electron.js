module.exports = {
  remote: {
    app: {
      getPath: p => `ELECTRON_PATH[${p}]`,
    },
  },
};
