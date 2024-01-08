describe('Config utils', () => {
  // stores the config module.
  let ConfigModule: any;

  // mock options before loading the config module.
  type mockOptions = {
    mockXdg?: boolean;
  };

  // (re)loads the config module for the new options to take effect.
  async function loadConfigModule(mockOptions: mockOptions = {}) {
    // reset modules
    jest.resetModules();

    // mock fs, which affect the config utils module.
    jest.mock('fs', () => ({
      existsSync: jest.fn(() => mockOptions.mockXdg === true),
    }));

    // import config module.
    await import('./config').then(module => {
      ConfigModule = module;
    });
  }

  describe('directory path', () => {
    it('should place network directory inside data directory', async () => {
      await loadConfigModule();
      const { dataPath, networksPath } = ConfigModule;
      expect(networksPath).toContain(dataPath);
    });

    it('should use XDG directory as Data directory if it exists', async () => {
      await loadConfigModule({ mockXdg: true });
      const { dataPath, xdgDataPath } = ConfigModule;
      expect(dataPath).toBe(xdgDataPath);
    });

    it('should not use XDG directory as Data directory if it does not exists', async () => {
      await loadConfigModule({ mockXdg: false });
      const { dataPath, xdgDataPath } = ConfigModule;
      expect(dataPath).not.toBe(xdgDataPath);
    });
  });
});
