import detectPort from 'detect-port';
import { createStore } from 'easy-peasy';
import { LndVersion, Status } from 'shared/types';
import { Network } from 'types';
import { initChartFromNetwork } from 'utils/chart';
import * as files from 'utils/files';
import { getNetwork, injections } from 'utils/tests';
import appModel from './app';
import bitcoindModel from './bitcoind';
import designerModel from './designer';
import lndModel from './lnd';
import networkModel from './network';

jest.mock('utils/files', () => ({
  waitForFile: jest.fn(),
  rm: jest.fn(),
}));
const filesMock = files as jest.Mocked<typeof files>;
const mockDetectPort = detectPort as jest.Mock;
const lndServiceMock = injections.lndService as jest.Mocked<typeof injections.lndService>;
const bitcoindServiceMock = injections.bitcoindService as jest.Mocked<
  typeof injections.bitcoindService
>;

describe('Network model', () => {
  const rootModel = {
    app: appModel,
    network: networkModel,
    lnd: lndModel,
    bitcoind: bitcoindModel,
    designer: designerModel,
  };
  // initialize store for type inference
  let store = createStore(rootModel, { injections });
  // helper to get the first network in the store
  const firstNetwork = () => store.getState().network.networks[0];

  // reusable args for adding a new network
  const addNetworkArgs = {
    name: 'test',
    lndNodes: 2,
    clightningNodes: 0,
    bitcoindNodes: 1,
  };

  beforeEach(() => {
    // reset the store before each test run
    store = createStore(rootModel, { injections });
    // always return true immediately
    filesMock.waitForFile.mockResolvedValue();
    lndServiceMock.waitUntilOnline.mockResolvedValue();
    bitcoindServiceMock.waitUntilOnline.mockResolvedValue();
  });

  it('should have a valid initial state', () => {
    expect(store.getState().network.networks).toEqual([]);
  });

  it('should load a list of networks', async () => {
    const mockNetworks = [getNetwork(1, 'test 1'), getNetwork(2, 'test 2')];
    const mockCharts = mockNetworks.map(initChartFromNetwork);
    const mockedLoad = injections.dockerService.loadNetworks as jest.Mock;
    mockedLoad.mockResolvedValue({ networks: mockNetworks, charts: mockCharts });
    await store.getActions().network.load();
    const [net1, net2] = store.getState().network.networks;
    expect(net1.name).toBe('test 1');
    expect(net2.name).toBe('test 2');
  });

  describe('Fetching', () => {
    it('should be able to fetch a node by id', () => {
      store.getActions().network.add(addNetworkArgs);
      const network = store.getState().network.networkById('1') as Network;
      expect(network).not.toBeNull();
      expect(network.id).toBe(1);
      expect(network.name).toBe('test');
    });

    it('should fail to fetch a node with invalid id', () => {
      store.getActions().network.add(addNetworkArgs);
      [99, '99', 'asdf', undefined, (null as unknown) as string].forEach(v => {
        expect(() => store.getState().network.networkById(v)).toThrow();
      });
    });
  });

  describe('Adding', () => {
    it('should add a new network', async () => {
      await store.getActions().network.addNetwork(addNetworkArgs);
      const { networks } = store.getState().network;
      expect(networks.length).toBe(1);
      expect(networks[0].name).toBe('test');
    });

    it('should call the docker service when adding a new network', async () => {
      await store.getActions().network.addNetwork(addNetworkArgs);
      expect(store.getState().network.networks.length).toBe(1);
      expect(injections.dockerService.saveComposeFile).toBeCalledTimes(1);
    });

    it('should add a network with the correct LND nodes', async () => {
      await store.getActions().network.addNetwork(addNetworkArgs);
      const { lightning } = firstNetwork().nodes;
      expect(lightning.length).toBe(2);
      lightning.forEach(node => {
        expect(node.type).toBe('lightning');
      });
    });

    it('should add a network with the correct bitcoind nodes', async () => {
      await store
        .getActions()
        .network.addNetwork({ ...addNetworkArgs, bitcoindNodes: 2 });
      const { networks } = store.getState().network;
      const { bitcoin } = networks[0].nodes;
      expect(bitcoin.length).toBe(2);
      bitcoin.forEach(node => {
        expect(node.type).toBe('bitcoin');
      });
    });

    it('should set all nodes to Stopped by default', async () => {
      await store.getActions().network.addNetwork(addNetworkArgs);
      const network = firstNetwork();
      const { bitcoin, lightning } = network.nodes;
      expect(network.status).toBe(Status.Stopped);
      bitcoin.forEach(node => expect(node.status).toBe(Status.Stopped));
      lightning.forEach(node => expect(node.status).toBe(Status.Stopped));
    });

    it('should be able to add multiple networks', async () => {
      await store.getActions().network.addNetwork(addNetworkArgs);
      await store.getActions().network.addNetwork({
        ...addNetworkArgs,
        name: 'test2',
      });
      const { networks } = store.getState().network;
      expect(networks.length).toBe(2);
      expect(networks[0].name).toBe('test');
      expect(networks[1].name).toBe('test2');
    });

    it('should save the networks to disk', async () => {
      await store.getActions().network.addNetwork(addNetworkArgs);
      expect(injections.dockerService.saveComposeFile).toBeCalledTimes(1);
      expect(injections.dockerService.saveNetworks).toBeCalledTimes(1);
    });
  });

  describe('Adding a Node', () => {
    beforeEach(async () => {
      await store.getActions().network.addNetwork(addNetworkArgs);
    });

    it('should add a node to an existing network', async () => {
      const payload = { id: firstNetwork().id, version: LndVersion.latest };
      store.getActions().network.addLndNode(payload);
      const { lightning } = firstNetwork().nodes;
      expect(lightning).toHaveLength(3);
      expect(lightning[2].name).toBe('carol');
    });

    it('should throw an error if the network id is invalid', async () => {
      const payload = { id: 999, version: LndVersion.latest };
      const { addLndNode } = store.getActions().network;
      await expect(addLndNode(payload)).rejects.toThrow(
        "Network with the id '999' was not found.",
      );
    });
  });

  describe('Removing a Node', () => {
    beforeEach(async () => {
      await store.getActions().network.addNetwork(addNetworkArgs);
    });

    it('should remove a node from an existing network', async () => {
      store.getActions().designer.setActiveId(1);
      const node = firstNetwork().nodes.lightning[0];
      store.getActions().network.removeNode({ node });
      const { lightning } = firstNetwork().nodes;
      expect(lightning).toHaveLength(1);
      expect(lightning[0].name).toBe('bob');
    });

    it('should throw an error if the network id is invalid', async () => {
      const node = firstNetwork().nodes.lightning[0];
      node.networkId = 999;
      const { removeNode } = store.getActions().network;
      await expect(removeNode({ node })).rejects.toThrow(
        "Network with the id '999' was not found.",
      );
    });
  });

  describe('Starting', () => {
    beforeEach(async () => {
      await store.getActions().network.addNetwork(addNetworkArgs);
    });

    it('should start a network by id', async () => {
      const { start } = store.getActions().network;
      await start(firstNetwork().id);
      expect(firstNetwork().status).toBe(Status.Started);
    });

    it('should update all node statuses when a network is started', async () => {
      const { start } = store.getActions().network;
      await start(firstNetwork().id);
      const { bitcoin, lightning } = firstNetwork().nodes;
      bitcoin.forEach(node => expect(node.status).toBe(Status.Started));
      lightning.forEach(node => expect(node.status).toBe(Status.Started));
    });

    it('should fail to start a network with an invalid id', async () => {
      const { start } = store.getActions().network;
      await expect(start(10)).rejects.toThrow();
    });

    it('should update all node statuses when a network fails to start', async () => {
      const { start } = store.getActions().network;
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
      const { start } = store.getActions().network;
      const network = firstNetwork();
      await start(network.id);
      expect(injections.dockerService.start).toBeCalledWith(
        expect.objectContaining({ id: network.id }),
      );
    });

    it('should set LND node status to error if the node startup fails', async () => {
      lndServiceMock.waitUntilOnline.mockRejectedValue(new Error('test-error'));
      const { start } = store.getActions().network;
      const network = firstNetwork();
      await start(network.id);
      const { lightning } = firstNetwork().nodes;
      lightning.forEach(node => expect(node.status).toBe(Status.Error));
      lightning.forEach(node => expect(node.errorMsg).toBe('test-error'));
    });

    it('should set bitcoind node status to error if the node startup fails', async () => {
      bitcoindServiceMock.waitUntilOnline.mockRejectedValue(new Error('test-error'));
      const { start } = store.getActions().network;
      const network = firstNetwork();
      await start(network.id);
      const { bitcoin } = firstNetwork().nodes;
      bitcoin.forEach(node => expect(node.status).toBe(Status.Error));
      bitcoin.forEach(node => expect(node.errorMsg).toBe('test-error'));
    });

    it('should not save compose file and networks if all ports are available', async () => {
      mockDetectPort.mockImplementation(port => Promise.resolve(port));
      (injections.dockerService.saveComposeFile as jest.Mock).mockReset();
      (injections.dockerService.saveNetworks as jest.Mock).mockReset();
      const { start } = store.getActions().network;
      const network = firstNetwork();
      await start(network.id);
      const { lightning } = firstNetwork().nodes;
      expect(lightning[0].ports.grpc).toBe(10001);
      expect(lightning[1].ports.grpc).toBe(10002);
      expect(injections.dockerService.saveComposeFile).toBeCalledTimes(0);
      expect(injections.dockerService.saveNetworks).toBeCalledTimes(0);
    });

    it('should save compose file and networks when a port is in use', async () => {
      const portsInUse = [10001];
      mockDetectPort.mockImplementation(port =>
        Promise.resolve(portsInUse.includes(port) ? port + 1 : port),
      );

      // add a second network to be sure updating works
      await store.getActions().network.addNetwork({
        ...addNetworkArgs,
        name: 'test2',
      });
      (injections.dockerService.saveComposeFile as jest.Mock).mockReset();
      (injections.dockerService.saveNetworks as jest.Mock).mockReset();
      const { start } = store.getActions().network;
      const network = firstNetwork();
      await start(network.id);
      const { lightning } = firstNetwork().nodes;
      expect(lightning[0].ports.grpc).toBe(10002);
      expect(lightning[1].ports.grpc).toBe(10003);
      expect(injections.dockerService.saveComposeFile).toBeCalledTimes(1);
      expect(injections.dockerService.saveNetworks).toBeCalledTimes(1);
    });
  });

  describe('Stopping', () => {
    beforeEach(() => {
      const { addNetwork } = store.getActions().network;
      addNetwork(addNetworkArgs);
    });

    it('should stop a network by id', async () => {
      const { stop } = store.getActions().network;
      await stop(firstNetwork().id);
      expect(firstNetwork().status).toBe(Status.Stopped);
    });

    it('should update all node statuses when a network is stopped', async () => {
      const { stop } = store.getActions().network;
      await stop(firstNetwork().id);
      const { bitcoin, lightning } = firstNetwork().nodes;
      bitcoin.forEach(node => expect(node.status).toBe(Status.Stopped));
      lightning.forEach(node => expect(node.status).toBe(Status.Stopped));
    });

    it('should fail to stop a network with an invalid id', async () => {
      const { stop } = store.getActions().network;
      await expect(stop(10)).rejects.toThrow();
    });

    it('should update all node statuses when a network fails to stop', async () => {
      const { stop } = store.getActions().network;
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
      const { stop } = store.getActions().network;
      await stop(firstNetwork().id);
      expect(injections.dockerService.stop).toBeCalledWith(firstNetwork());
    });
  });

  describe('Toggle', () => {
    beforeEach(() => {
      const { addNetwork } = store.getActions().network;
      addNetwork(addNetworkArgs);
    });

    it('should start if its currently stopped', async () => {
      const { toggle } = store.getActions().network;
      await toggle(firstNetwork().id);
      expect(firstNetwork().status).toBe(Status.Started);
    });

    it('should restart if its currently error', async () => {
      const { setStatus, toggle } = store.getActions().network;
      const id = firstNetwork().id;
      setStatus({ id, status: Status.Error });
      await toggle(id);
      expect(firstNetwork().status).toBe(Status.Started);
    });

    it('should stop if its currently started', async () => {
      const { setStatus, toggle } = store.getActions().network;
      const id = firstNetwork().id;
      setStatus({ id, status: Status.Started });
      await toggle(id);
      expect(firstNetwork().status).toBe(Status.Stopped);
    });

    it('should do nothing if its currently starting', async () => {
      const { setStatus, toggle } = store.getActions().network;
      const id = firstNetwork().id;
      setStatus({ id, status: Status.Starting });
      await toggle(id);
      expect(firstNetwork().status).toBe(Status.Starting);
    });

    it('should do nothing if its currently stopping', async () => {
      const { setStatus, toggle } = store.getActions().network;
      const id = firstNetwork().id;
      setStatus({ id, status: Status.Stopping });
      await toggle(id);
      expect(firstNetwork().status).toBe(Status.Stopping);
    });

    it('should fail to toggle a network with an invalid id', async () => {
      const { toggle } = store.getActions().network;
      await expect(toggle(10)).rejects.toThrow();
    });
  });

  describe('Other actions', () => {
    it('should fail to set the status with an invalid id', () => {
      const { setStatus: setNetworkStatus } = store.getActions().network;
      expect(() => setNetworkStatus({ id: 10, status: Status.Starting })).toThrow();
    });

    it('should fail to rename with an invalid id', async () => {
      const { rename } = store.getActions().network;
      await expect(rename({ id: 10, name: 'asdf' })).rejects.toThrow();
    });

    it('should fail to remove with an invalid id', async () => {
      const { remove } = store.getActions().network;
      await expect(remove(10)).rejects.toThrow();
    });
  });
});
