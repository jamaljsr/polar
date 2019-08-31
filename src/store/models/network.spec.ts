import { createStore } from 'easy-peasy';
import { Network, Status } from 'types';
import { getNetwork, injections } from 'utils/tests';
import networkModel from './network';

describe('Network model', () => {
  // initialize store for type inference
  let store = createStore(networkModel, { injections });
  // helper to get the first network in the store
  const firstNetwork = () => store.getState().networks[0];

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

  it('should load a list of networks', async () => {
    const mockNetworks = [getNetwork(1, 'test 1'), getNetwork(2, 'test 2')];
    const mockedLoad = injections.dockerService.load as jest.Mock;
    mockedLoad.mockResolvedValue(mockNetworks);
    await store.getActions().load();
    const [net1, net2] = store.getState().networks;
    expect(net1.name).toBe('test 1');
    expect(net2.name).toBe('test 2');
  });

  describe('Fetching', () => {
    it('should be able to fetch a node by id', () => {
      store.getActions().add(addNetworkArgs);
      const network = store.getState().networkById('1') as Network;
      expect(network).not.toBeNull();
      expect(network.id).toBe(1);
      expect(network.name).toBe('test');
    });

    it('should fail to fetch a node with invalid id', () => {
      store.getActions().add(addNetworkArgs);
      [99, '99', 'asdf', undefined, (null as unknown) as string].forEach(v => {
        expect(() => store.getState().networkById(v)).toThrow();
      });
    });
  });

  describe('Adding', () => {
    it('should add a new network', async () => {
      await store.getActions().addNetwork(addNetworkArgs);
      const { networks } = store.getState();
      expect(networks.length).toBe(1);
      expect(networks[0].name).toBe('test');
    });

    it('should call the docker service when adding a new network', async () => {
      await store.getActions().addNetwork(addNetworkArgs);
      expect(store.getState().networks.length).toBe(1);
      expect(injections.dockerService.create).toBeCalledTimes(1);
    });

    it('should add a network with the correct LND nodes', async () => {
      await store.getActions().addNetwork(addNetworkArgs);
      const { lightning } = firstNetwork().nodes;
      expect(lightning.length).toBe(2);
      lightning.forEach(node => {
        expect(node.type).toBe('lightning');
      });
    });

    it('should add a network with the correct bitcoind nodes', async () => {
      await store.getActions().addNetwork(addNetworkArgs);
      const { networks } = store.getState();
      const { bitcoin } = networks[0].nodes;
      expect(bitcoin.length).toBe(1);
      bitcoin.forEach(node => {
        expect(node.type).toBe('bitcoin');
      });
    });

    it('should set all nodes to Stopped by default', async () => {
      await store.getActions().addNetwork(addNetworkArgs);
      const network = firstNetwork();
      const { bitcoin, lightning } = network.nodes;
      expect(network.status).toBe(Status.Stopped);
      bitcoin.forEach(node => expect(node.status).toBe(Status.Stopped));
      lightning.forEach(node => expect(node.status).toBe(Status.Stopped));
    });

    it('should be able to add multiple networks', async () => {
      await store.getActions().addNetwork(addNetworkArgs);
      await store.getActions().addNetwork({
        ...addNetworkArgs,
        name: 'test2',
      });
      const { networks } = store.getState();
      expect(networks.length).toBe(2);
      expect(networks[0].name).toBe('test');
      expect(networks[1].name).toBe('test2');
    });

    it('should save the networks to disk', async () => {
      await store.getActions().addNetwork(addNetworkArgs);
      expect(injections.dockerService.create).toBeCalledTimes(1);
      expect(injections.dockerService.save).toBeCalledTimes(1);
    });
  });

  describe('Starting', () => {
    beforeEach(async () => {
      await store.getActions().addNetwork(addNetworkArgs);
    });

    it('should start a network by id', async () => {
      const { start } = store.getActions();
      await start(firstNetwork().id);
      expect(firstNetwork().status).toBe(Status.Started);
    });

    it('should update all node statuses when a network is started', async () => {
      const { start } = store.getActions();
      await start(firstNetwork().id);
      const { bitcoin, lightning } = firstNetwork().nodes;
      bitcoin.forEach(node => expect(node.status).toBe(Status.Started));
      lightning.forEach(node => expect(node.status).toBe(Status.Started));
    });

    it('should fail to start a network with an invalid id', async () => {
      const { start } = store.getActions();
      await expect(start(10)).rejects.toThrow();
    });

    it('should update all node statuses when a network fails to start', async () => {
      const { start } = store.getActions();
      // mock dockerService.start to throw an error
      const mockDockerStart = injections.dockerService.start as jest.Mock;
      mockDockerStart.mockRejectedValueOnce(new Error('start failed'));
      // call start
      await expect(start(firstNetwork().id)).rejects.toThrow('start failed');
      // verify error statuses
      const network = firstNetwork();
      const { bitcoin, lightning } = network.nodes;
      expect(network.status).toBe(Status.Error);
      bitcoin.forEach(node => expect(node.status).toBe(Status.Error));
      lightning.forEach(node => expect(node.status).toBe(Status.Error));
    });

    it('should call the dockerService when starting a network', async () => {
      const { start } = store.getActions();
      await start(firstNetwork().id);
      expect(injections.dockerService.start).toBeCalledWith(firstNetwork());
    });
  });

  describe('Stopping', () => {
    it('should stop a network by id', async () => {
      const { add, stop } = store.getActions();
      add(addNetworkArgs);
      await stop(firstNetwork().id);
      expect(firstNetwork().status).toBe(Status.Stopped);
    });

    it('should update all node statuses when a network is stopped', async () => {
      const { add, stop } = store.getActions();
      add(addNetworkArgs);
      await stop(firstNetwork().id);
      const { bitcoin, lightning } = firstNetwork().nodes;
      bitcoin.forEach(node => expect(node.status).toBe(Status.Stopped));
      lightning.forEach(node => expect(node.status).toBe(Status.Stopped));
    });

    it('should fail to stop a network with an invalid id', async () => {
      const { add, stop } = store.getActions();
      add(addNetworkArgs);
      await expect(stop(10)).rejects.toThrow();
    });

    it('should update all node statuses when a network fails to stop', async () => {
      const { add, stop } = store.getActions();
      add(addNetworkArgs);
      // mock dockerService.stop to throw an error
      const mockDockerStart = injections.dockerService.stop as jest.Mock;
      mockDockerStart.mockRejectedValueOnce(new Error('stop failed'));
      // call stop
      await expect(stop(firstNetwork().id)).rejects.toThrow('stop failed');
      // verify error statuses
      const network = firstNetwork();
      const { bitcoin, lightning } = network.nodes;
      expect(network.status).toBe(Status.Error);
      bitcoin.forEach(node => expect(node.status).toBe(Status.Error));
      lightning.forEach(node => expect(node.status).toBe(Status.Error));
    });

    it('should call the dockerService when stopping a network', async () => {
      const { add, stop } = store.getActions();
      add(addNetworkArgs);
      await stop(firstNetwork().id);
      expect(injections.dockerService.stop).toBeCalledWith(firstNetwork());
    });
  });

  describe('Toggle', () => {
    it('should start if its currently stopped', async () => {
      const { add, toggle } = store.getActions();
      add(addNetworkArgs);
      await toggle(firstNetwork().id);
      expect(firstNetwork().status).toBe(Status.Started);
    });

    it('should restart if its currently error', async () => {
      const { add, setNetworkStatus, toggle } = store.getActions();
      add(addNetworkArgs);
      const id = firstNetwork().id;
      setNetworkStatus({ id, status: Status.Error });
      await toggle(id);
      expect(firstNetwork().status).toBe(Status.Started);
    });

    it('should stop if its currently started', async () => {
      const { add, setNetworkStatus, toggle } = store.getActions();
      add(addNetworkArgs);
      const id = firstNetwork().id;
      setNetworkStatus({ id, status: Status.Started });
      await toggle(id);
      expect(firstNetwork().status).toBe(Status.Stopped);
    });

    it('should do nothing if its currently starting', async () => {
      const { add, setNetworkStatus, toggle } = store.getActions();
      add(addNetworkArgs);
      const id = firstNetwork().id;
      setNetworkStatus({ id, status: Status.Starting });
      await toggle(id);
      expect(firstNetwork().status).toBe(Status.Starting);
    });

    it('should do nothing if its currently stopping', async () => {
      const { add, setNetworkStatus, toggle } = store.getActions();
      add(addNetworkArgs);
      const id = firstNetwork().id;
      setNetworkStatus({ id, status: Status.Stopping });
      await toggle(id);
      expect(firstNetwork().status).toBe(Status.Stopping);
    });
  });
});
