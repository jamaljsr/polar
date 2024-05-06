import { notification } from 'antd';
import { createStore } from 'easy-peasy';
import os from 'os';
import { defaultRepoState } from 'utils/constants';
import { injections } from 'utils/tests';
import appModel from './app';
import designerModel from './designer';
import modalsModel from './modals';
import networkModel from './network';

jest.mock('os');

const mockOS = os as jest.Mocked<typeof os>;
const mockDockerService = injections.dockerService as jest.Mocked<
  typeof injections.dockerService
>;
const mockSettingsService = injections.settingsService as jest.Mocked<
  typeof injections.settingsService
>;

const mockRepoService = injections.repoService as jest.Mocked<
  typeof injections.repoService
>;

describe('App model', () => {
  const rootModel = {
    app: appModel,
    network: networkModel,
    designer: designerModel,
    modals: modalsModel,
  };
  // initialize store for type inference
  let store = createStore(rootModel, { injections });

  beforeEach(() => {
    // reset the store before each test run
    store = createStore(rootModel, { injections });
    mockDockerService.getVersions.mockResolvedValue({ docker: '', compose: '' });
    mockDockerService.loadNetworks.mockResolvedValue({
      version: '0.0.0',
      networks: [],
      charts: {},
    });
    mockSettingsService.load.mockResolvedValue({
      lang: 'en-US',
      checkForUpdatesOnStartup: false,
      theme: 'dark',
      nodeImages: { custom: [], managed: [] },
      newNodeCounts: {
        LND: 1,
        'c-lightning': 1,
        eclair: 1,
        bitcoind: 1,
        btcd: 0,
        tapd: 0,
        litd: 0,
      },
      basePorts: {
        LND: {
          rest: 8080,
          grpc: 10001,
        },
        bitcoind: {
          rest: 18443,
        },
        'c-lightning': {
          rest: 8181,
          grpc: 11001,
        },
        eclair: {
          rest: 8281,
        },
        tapd: {
          rest: 8289,
          grpc: 12029,
        },
      },
    });
    mockRepoService.load.mockResolvedValue({
      ...defaultRepoState,
      version: defaultRepoState.version + 1,
    });
  });

  it('should initialize', async () => {
    await store.getActions().app.initialize();
    expect(store.getState().app.initialized).toBe(true);
    expect(mockSettingsService.load).toHaveBeenCalledTimes(1);
    expect(mockDockerService.getVersions).toHaveBeenCalledTimes(1);
    expect(mockDockerService.loadNetworks).toHaveBeenCalledTimes(1);
  });

  it('should have correct default node counts on Windows', async () => {
    mockOS.platform.mockReturnValue('win32');
    mockSettingsService.load.mockResolvedValue({
      lang: 'en-US',
      showAllNodeVersions: true,
      checkForUpdatesOnStartup: false,
      theme: 'dark',
      nodeImages: { custom: [], managed: [] },
    } as any);
    await store.getActions().app.initialize();
    expect(store.getState().app.initialized).toBe(true);
    expect(store.getState().app.settings.newNodeCounts).toEqual({
      LND: 2,
      'c-lightning': 0,
      eclair: 1,
      bitcoind: 1,
      btcd: 0,
      tapd: 0,
      litd: 0,
    });
  });

  it('should initialize with missing settings', async () => {
    mockSettingsService.load.mockResolvedValue(undefined);
    await store.getActions().app.initialize();
    expect(store.getState().app.initialized).toBe(true);
  });

  it('should initialize with missing theme', async () => {
    mockSettingsService.load.mockResolvedValue({ lang: 'en-US' } as any);
    await store.getActions().app.initialize();
    expect(store.getState().app.initialized).toBe(true);
    expect(store.getState().app.settings.theme).toBe('dark');
  });

  it('should update settings', async () => {
    store.getActions().app.updateSettings({ theme: 'dark' });
    expect(store.getState().app.settings.theme).toBe('dark');
  });

  it('should truncate long error notifications', async () => {
    const spy = jest.spyOn(notification, 'error');
    const error = new Error(new Array(100).join('this is a very long error message. '));
    store.getActions().app.notify({ message: 'test', error });
    expect(spy).toBeCalledWith({
      message: 'test',
      placement: 'bottomRight',
      bottom: 50,
      duration: 10,
      description: error.message.substring(0, 255) + '...',
    });
  });

  describe('check for updates', () => {
    beforeEach(() => {
      mockSettingsService.load.mockResolvedValue({
        lang: 'en-US',
        checkForUpdatesOnStartup: true,
        theme: 'dark',
        nodeImages: { custom: [], managed: [] },
        newNodeCounts: {
          LND: 1,
          'c-lightning': 1,
          eclair: 1,
          bitcoind: 1,
          btcd: 1,
          tapd: 1,
          litd: 0,
        },
        basePorts: {
          LND: {
            rest: 8080,
            grpc: 10001,
          },
          bitcoind: {
            rest: 18443,
          },
          'c-lightning': {
            rest: 8181,
            grpc: 11001,
          },
          eclair: {
            rest: 8281,
          },
          tapd: {
            rest: 8289,
            grpc: 12029,
          },
        },
      });
    });

    it('should check for updates on startup', async () => {
      mockRepoService.checkForUpdates.mockResolvedValue({
        state: defaultRepoState,
      });
      await store.getActions().app.initialize();
      expect(store.getState().app.initialized).toBe(true);
      expect(mockRepoService.checkForUpdates).toHaveBeenCalledTimes(1);
      expect(store.getState().modals.imageUpdates.visible).toBe(false);
    });

    it('should display updates modal on startup', async () => {
      mockRepoService.checkForUpdates.mockResolvedValue({
        state: defaultRepoState,
        updates: {
          LND: ['0.99.0-beta'], // a new version available for LND
          'c-lightning': [],
          eclair: [],
          litd: [],
          bitcoind: [],
          btcd: [],
          tapd: [],
        },
      });

      await store.getActions().app.initialize();
      expect(store.getState().app.initialized).toBe(true);
      expect(mockRepoService.checkForUpdates).toHaveBeenCalledTimes(1);
      expect(store.getState().modals.imageUpdates.visible).toBe(true);
    });

    it('should not throw an error', async () => {
      mockRepoService.checkForUpdates.mockRejectedValue(new Error('something'));
      expect(store.getActions().app.initialize()).resolves.not.toThrow();
    });
  });

  describe('with mocked actions', () => {
    beforeEach(() => {
      // reset the store before each test run
      store = createStore(rootModel, { injections, mockActions: true });
    });

    it('should dispatch a push action in navigateTo', () => {
      store.getActions().app.navigateTo('/test');
      expect(store.getMockedActions()).toContainEqual({
        payload: {
          args: ['/test'],
          method: 'push',
        },
        type: '@@router/CALL_HISTORY_METHOD',
      });
    });
  });
});
