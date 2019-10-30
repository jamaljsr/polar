import { createStore } from 'easy-peasy';
import { injections } from 'utils/tests';
import appModel from './app';
import designerModel from './designer';
import networkModel from './network';

const mockDockerService = injections.dockerService as jest.Mocked<
  typeof injections.dockerService
>;

describe('App model', () => {
  const rootModel = {
    app: appModel,
    network: networkModel,
    designer: designerModel,
  };
  // initialize store for type inference
  let store = createStore(rootModel, { injections });

  beforeEach(() => {
    // reset the store before each test run
    store = createStore(rootModel, { injections });
    mockDockerService.getVersions.mockResolvedValue({ docker: '', compose: '' });
    mockDockerService.loadNetworks.mockResolvedValue({ networks: [], charts: {} });
  });

  it('should initialize', async () => {
    await store.getActions().app.initialize();
    expect(store.getState().app.initialized).toBe(true);
    expect(mockDockerService.getVersions).toBeCalledTimes(1);
    expect(mockDockerService.loadNetworks).toBeCalledTimes(1);
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
