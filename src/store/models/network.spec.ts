import networkModel from './network';
import { createStore } from 'easy-peasy';
import { Status, Network } from 'types';

describe('counter model', () => {
  const injections = {
    networkManager: {
      create: jest.fn(),
    },
  };
  // initialize store for type inference
  let store = createStore(networkModel, { injections });

  // reusable args for adding a new network
  const addNetworkArgs = {
    name: 'test',
    lndNodes: 2,
    bitcoindNodes: 1,
  };

  beforeEach(() => {
    // reset the store before each test run
    store = createStore(networkModel, { injections });
  });

  it('should have a valid initial state', () => {
    expect(store.getState().networks).toEqual([]);
  });

  it('should add a new network', () => {
    store.getActions().add(addNetworkArgs);
    const { networks } = store.getState();
    expect(networks.length).toBe(1);
    expect(networks[0].name).toBe('test');
  });

  it('should call the network manager', async () => {
    await store.getActions().addNetwork(addNetworkArgs);
    expect(store.getState().networks.length).toBe(1);
    expect(injections.networkManager.create).toBeCalled();
  });

  it('should add a network with the correct LND nodes', () => {
    store.getActions().add(addNetworkArgs);
    const { networks } = store.getState();
    const { lightning } = networks[0].nodes;
    expect(lightning.length).toBe(2);
    lightning.forEach(node => {
      expect(node.type).toBe('lightning');
    });
  });

  it('should add a network with the correct bitcoind nodes', () => {
    store.getActions().add(addNetworkArgs);
    const { networks } = store.getState();
    const { bitcoin } = networks[0].nodes;
    expect(bitcoin.length).toBe(1);
    bitcoin.forEach(node => {
      expect(node.type).toBe('bitcoin');
    });
  });

  it('should set all nodes to Stopped by default', () => {
    store.getActions().add(addNetworkArgs);
    const { networks } = store.getState();
    const { bitcoin, lightning } = networks[0].nodes;
    expect(networks[0].status).toBe(Status.Stopped);
    bitcoin.forEach(node => {
      expect(node.status).toBe(Status.Stopped);
    });
    lightning.forEach(node => {
      expect(node.status).toBe(Status.Stopped);
    });
  });

  it('should be able to add multiple networks', () => {
    store.getActions().add(addNetworkArgs);
    store.getActions().add({
      ...addNetworkArgs,
      name: 'test2',
    });
    const { networks } = store.getState();
    expect(networks.length).toBe(2);
    expect(networks[0].name).toBe('test');
    expect(networks[1].name).toBe('test2');
  });

  it('should be able to fetch a node by id', () => {
    store.getActions().add(addNetworkArgs);
    const network = store.getState().networkById('1') as Network;
    expect(network).not.toBeNull();
    expect(network.id).toBe(1);
    expect(network.name).toBe('test');
  });

  it('should fail to fetch a node with invalid id', () => {
    store.getActions().add(addNetworkArgs);
    expect(store.getState().networkById((null as unknown) as string)).toBeUndefined();
    expect(store.getState().networkById('asdf')).toBeUndefined();
    expect(store.getState().networkById('99')).toBeUndefined();
  });
});
