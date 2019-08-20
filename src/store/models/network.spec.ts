import networkModel from './network';
import { createStore } from 'easy-peasy';

describe('counter model', () => {
  const injections = {
    networkManager: {
      create: jest.fn(),
    },
  };
  // initialize store for type inference
  let store = createStore(networkModel, { injections });

  beforeEach(() => {
    // reset the store before each test run
    store = createStore(networkModel, { injections });
  });

  it('should have a valid initial state', () => {
    expect(store.getState().networks).toEqual([]);
  });

  it('should add a new network', () => {
    store.getActions().add('test');
    const { networks } = store.getState();
    expect(networks.length).toBe(1);
    expect(networks[0].name).toBe('test');
  });

  it('should call the network manager', async () => {
    await store.getActions().addNetwork('test');
    expect(store.getState().networks.length).toBe(1);
    expect(injections.networkManager.create).toBeCalled();
  });
});
