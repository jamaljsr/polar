import detectPort from 'detect-port';
import {
  BitcoinNode,
  CLightningNode,
  EclairNode,
  LndNode,
  NodeImplementation,
  Status,
  TapdNode,
} from 'shared/types';
import { Network } from 'types';
import { defaultRepoState } from './constants';
import {
  createCLightningNetworkNode,
  createLndNetworkNode,
  createTapdNetworkNode,
  getCLightningFilePaths,
  getImageCommand,
  getLndFilePaths,
  getOpenPortRange,
  getOpenPorts,
  getTapdFilePaths,
  OpenPorts,
  renameNode,
} from './network';
import { getNetwork, testManagedImages } from './tests';

const mockDetectPort = detectPort as jest.Mock;

describe('Network Utils', () => {
  describe('getImageCommand', () => {
    it('should return the commands for managed images', () => {
      // create images with the commands set to their implementation
      const images = testManagedImages.map(i => ({ ...i, command: i.implementation }));
      const impls: NodeImplementation[] = ['LND', 'c-lightning', 'bitcoind'];
      impls.forEach(impl => {
        expect(getImageCommand(images, impl, defaultRepoState.images[impl].latest)).toBe(
          impl,
        );
      });
    });

    it('should thrown an error if the image was not found', () => {
      expect(() => getImageCommand(testManagedImages, 'LND', 'invalid')).toThrow();
    });
  });

  describe('getOpenPortRange', () => {
    beforeEach(() => {
      let port = 10003;
      mockDetectPort.mockImplementation(() => Promise.resolve(port++));
    });

    it('should return valid open ports', async () => {
      const ports = await getOpenPortRange([10001, 10002, 10003]);
      expect(ports).toEqual([10003, 10004, 10005]);
    });
  });

  describe('getOpenPorts', () => {
    let network: Network;

    beforeEach(() => {
      network = getNetwork();
    });

    it('should update the ports for bitcoind', async () => {
      mockDetectPort.mockImplementation(port => Promise.resolve(port + 1));
      network.nodes.lightning = [];
      const restPort = network.nodes.bitcoin[0].ports.rpc;
      const p2pPort = network.nodes.bitcoin[0].ports.p2p;
      const zmqBlockPort = network.nodes.bitcoin[0].ports.zmqBlock;
      const zmqTxPort = network.nodes.bitcoin[0].ports.zmqTx;
      const ports = (await getOpenPorts(network)) as OpenPorts;
      expect(ports).toBeDefined();
      expect(ports[network.nodes.bitcoin[0].name].rpc).toBe(restPort + 1);
      expect(ports[network.nodes.bitcoin[0].name].p2p).toBe(p2pPort + 1);
      expect(ports[network.nodes.bitcoin[0].name].zmqBlock).toBe(zmqBlockPort + 1);
      expect(ports[network.nodes.bitcoin[0].name].zmqTx).toBe(zmqTxPort + 1);
    });

    it('should update the rest port for bitcoind', async () => {
      const portsInUse = [18443];
      mockDetectPort.mockImplementation(port =>
        Promise.resolve(portsInUse.includes(port) ? port + 1 : port),
      );
      network.nodes.lightning = [];
      const restPort = network.nodes.bitcoin[0].ports.rpc;
      const ports = (await getOpenPorts(network)) as OpenPorts;
      expect(ports).toBeDefined();
      expect(ports[network.nodes.bitcoin[0].name].rpc).toBe(restPort + 1);
      expect(ports[network.nodes.bitcoin[0].name].zmqBlock).toBeUndefined();
      expect(ports[network.nodes.bitcoin[0].name].zmqTx).toBeUndefined();
    });

    it('should update the p2p port for bitcoind', async () => {
      const portsInUse = [19444];
      mockDetectPort.mockImplementation(port =>
        Promise.resolve(portsInUse.includes(port) ? port + 1 : port),
      );
      network.nodes.lightning = [];
      const p2pPort = network.nodes.bitcoin[0].ports.p2p;
      const ports = (await getOpenPorts(network)) as OpenPorts;
      expect(ports).toBeDefined();
      expect(ports[network.nodes.bitcoin[0].name].p2p).toBe(p2pPort + 1);
      expect(ports[network.nodes.bitcoin[0].name].zmqBlock).toBeUndefined();
      expect(ports[network.nodes.bitcoin[0].name].zmqTx).toBeUndefined();
    });

    it('should update the zmq block port for bitcoind', async () => {
      const portsInUse = [28334];
      mockDetectPort.mockImplementation(port =>
        Promise.resolve(portsInUse.includes(port) ? port + 1 : port),
      );
      network.nodes.lightning = [];
      const zmqBlockPort = network.nodes.bitcoin[0].ports.zmqBlock;
      const ports = (await getOpenPorts(network)) as OpenPorts;
      expect(ports).toBeDefined();
      expect(ports[network.nodes.bitcoin[0].name].rest).toBeUndefined();
      expect(ports[network.nodes.bitcoin[0].name].zmqBlock).toBe(zmqBlockPort + 1);
      expect(ports[network.nodes.bitcoin[0].name].zmqTx).toBeUndefined();
    });

    it('should update the zmq tx port for bitcoind', async () => {
      const portsInUse = [29335];
      mockDetectPort.mockImplementation(port =>
        Promise.resolve(portsInUse.includes(port) ? port + 1 : port),
      );
      network.nodes.lightning = [];
      const zmqTxPort = network.nodes.bitcoin[0].ports.zmqTx;
      const ports = (await getOpenPorts(network)) as OpenPorts;
      expect(ports).toBeDefined();
      expect(ports[network.nodes.bitcoin[0].name].rest).toBeUndefined();
      expect(ports[network.nodes.bitcoin[0].name].zmqBlock).toBeUndefined();
      expect(ports[network.nodes.bitcoin[0].name].zmqTx).toBe(zmqTxPort + 1);
    });

    it('should update the grpc ports for lightning nodes', async () => {
      const portsInUse = [10001];
      mockDetectPort.mockImplementation(port =>
        Promise.resolve(portsInUse.includes(port) ? port + 1 : port),
      );
      network.nodes.bitcoin = [];
      const ports = (await getOpenPorts(network)) as OpenPorts;
      expect(ports).toBeDefined();
      expect(ports[network.nodes.lightning[0].name].grpc).toBe(10002);
      expect(ports[network.nodes.lightning[3].name].grpc).toBe(10004);
    });

    it("should not update zero'd grpc port for c-lightning nodes", async () => {
      const portsInUse = [8182, 10001];
      mockDetectPort.mockImplementation(port =>
        Promise.resolve(portsInUse.includes(port) ? port + 1 : port),
      );
      network.nodes.bitcoin = [];
      // set port to 0, mimicking an old c-lightning node
      (network.nodes.lightning[1] as CLightningNode).ports.grpc = 0;
      const ports = (await getOpenPorts(network)) as OpenPorts;
      expect(ports).toBeDefined();
      expect(ports[network.nodes.lightning[1].name].rest).toBe(8183);
      expect(ports[network.nodes.lightning[1].name].grpc).toBeUndefined();
    });

    it('should update the rest ports for lightning nodes', async () => {
      const portsInUse = [8081];
      mockDetectPort.mockImplementation(port =>
        Promise.resolve(portsInUse.includes(port) ? port + 1 : port),
      );
      network.nodes.bitcoin = [];
      const ports = (await getOpenPorts(network)) as OpenPorts;
      expect(ports).toBeDefined();
      expect(ports[network.nodes.lightning[0].name].rest).toBe(8082);
      expect(ports[network.nodes.lightning[3].name].rest).toBe(8084);
    });

    it('should update the p2p ports for lightning nodes', async () => {
      const portsInUse = [9735, 9836, 9937, 9737];
      mockDetectPort.mockImplementation(port =>
        Promise.resolve(portsInUse.includes(port) ? port + 1 : port),
      );
      network.nodes.bitcoin = [];
      const ports = (await getOpenPorts(network)) as OpenPorts;
      expect(ports).toBeDefined();
      expect(ports[network.nodes.lightning[0].name].p2p).toBe(9736);
      expect(ports[network.nodes.lightning[1].name].p2p).toBe(9837);
      expect(ports[network.nodes.lightning[2].name].p2p).toBe(9938);
      expect(ports[network.nodes.lightning[3].name].p2p).toBe(9738);
    });

    it('should not update ports if none are in use', async () => {
      const portsInUse: number[] = [];
      mockDetectPort.mockImplementation(port =>
        Promise.resolve(portsInUse.includes(port) ? port + 1 : port),
      );
      network.nodes.bitcoin = [];
      const ports = await getOpenPorts(network);
      expect(ports).toBeUndefined();
    });

    it('should update the grpc ports for TAP nodes', async () => {
      network = getNetwork(1, 'tap network', undefined, 3);
      const portsInUse = [12030];
      mockDetectPort.mockImplementation(port =>
        Promise.resolve(portsInUse.includes(port) ? port + 1 : port),
      );
      network.nodes.bitcoin = [];
      network.nodes.lightning = [];
      const ports = (await getOpenPorts(network)) as OpenPorts;
      expect(ports).toBeDefined();
      expect(ports[network.nodes.tap[0].name].grpc).toBe(12029);
      expect(ports[network.nodes.tap[1].name].grpc).toBe(12031);
      expect(ports[network.nodes.tap[2].name].grpc).toBe(12032);
    });

    it('should update the rest ports for TAP nodes', async () => {
      network = getNetwork(1, 'tap network', undefined, 3);
      const portsInUse = [8290];
      mockDetectPort.mockImplementation(port =>
        Promise.resolve(portsInUse.includes(port) ? port + 1 : port),
      );
      network.nodes.bitcoin = [];
      network.nodes.lightning = [];
      const ports = (await getOpenPorts(network)) as OpenPorts;
      expect(ports).toBeDefined();
      expect(ports[network.nodes.tap[0].name].rest).toBe(8289);
      expect(ports[network.nodes.tap[1].name].rest).toBe(8291);
      expect(ports[network.nodes.tap[2].name].rest).toBe(8292);
    });

    it('should not update TAP ports if none are in use', async () => {
      network = getNetwork(1, 'tap network', undefined, 3);
      const portsInUse: number[] = [];
      mockDetectPort.mockImplementation(port =>
        Promise.resolve(portsInUse.includes(port) ? port + 1 : port),
      );
      network.nodes.bitcoin = [];
      network.nodes.lightning = [];
      const ports = await getOpenPorts(network);
      expect(ports).toBeUndefined();
    });

    it('should not update ports for started nodes', async () => {
      mockDetectPort.mockImplementation(port => Promise.resolve(port + 1));
      network.nodes.lightning[0].status = Status.Started;
      const ports = (await getOpenPorts(network)) as OpenPorts;
      expect(ports).toBeDefined();
      // alice ports should not be changed
      expect(ports[network.nodes.lightning[0].name]).toBeUndefined();
      // bob ports should change
      const lnd2 = network.nodes.lightning[3] as LndNode;
      expect(ports[lnd2.name].grpc).toBe(lnd2.ports.grpc + 1);
      expect(ports[lnd2.name].rest).toBe(lnd2.ports.rest + 1);
    });
  });

  describe('createNetworkNodes', () => {
    let network: Network;

    beforeEach(() => {
      network = getNetwork(1, 'tap network', undefined, 3);
    });

    it('should add a tap node to the network', async () => {
      const lnd = createLndNetworkNode(
        network,
        defaultRepoState.images.LND.latest,
        defaultRepoState.images.LND.compatibility,
        { image: '', command: '' },
        Status.Stopped,
      );
      network.nodes.lightning.push(lnd);
      expect(network.nodes.lightning.length).toBe(4);
      const tap = createTapdNetworkNode(
        network,
        defaultRepoState.images.tapd.latest,
        defaultRepoState.images.tapd.compatibility,
        { image: '', command: '' },
        Status.Stopped,
      );
      network.nodes.tap.push(tap);
      expect(network.nodes.tap.length).toBe(4);
    });

    it('should add a tap node linked to the exact minimum LND version', async () => {
      const lnd = createLndNetworkNode(
        network,
        '0.16.0-beta',
        defaultRepoState.images.LND.compatibility,
        { image: '', command: '' },
        Status.Stopped,
      );
      network.nodes.lightning.push(lnd);
      expect(network.nodes.lightning.length).toBe(4);
      const tap = createTapdNetworkNode(
        network,
        defaultRepoState.images.tapd.latest,
        defaultRepoState.images.tapd.compatibility,
        { image: '', command: '' },
        Status.Stopped,
      );
      network.nodes.tap.push(tap);
      expect(network.nodes.tap.length).toBe(4);
    });

    it('should fail to create a tap node without a compatible LND version', async () => {
      const lnd = createLndNetworkNode(
        network,
        '0.15.5-beta',
        defaultRepoState.images.LND.compatibility,
        { image: '', command: '' },
        Status.Stopped,
      );
      network.nodes.lightning.push(lnd);
      expect(network.nodes.lightning.length).toBe(4);

      const { latest, compatibility } = defaultRepoState.images.tapd;
      const createNode = () =>
        createTapdNetworkNode(
          network,
          latest,
          compatibility,
          { image: '', command: '' },
          Status.Stopped,
        );
      const compatibleLnd = compatibility![latest];
      expect(() => createNode()).toThrowError(
        new Error(
          `This network does not contain a LND v${compatibleLnd} (or higher) node which is required for tapd v${latest}`,
        ),
      );
    });

    it('should fail to create a tap node with no LND nodes left', async () => {
      const cln = createCLightningNetworkNode(
        network,
        defaultRepoState.images['c-lightning'].latest,
        defaultRepoState.images['c-lightning'].compatibility,
        { image: '', command: '' },
        Status.Stopped,
      );
      network.nodes.lightning.push(cln);

      const { latest, compatibility } = defaultRepoState.images.tapd;
      const createNode = () =>
        createTapdNetworkNode(
          network,
          latest,
          compatibility,
          { image: '', command: '' },
          Status.Stopped,
        );
      const compatibleLnd = compatibility![latest];
      expect(() => createNode()).toThrowError(
        new Error(
          `This network does not contain a LND v${compatibleLnd} (or higher) node which is required for tapd v${latest}`,
        ),
      );
    });
  });

  describe('renameNode', () => {
    let network: Network;

    beforeEach(() => {
      network = getNetwork();
    });

    it('should rename a lightning LND node', async () => {
      const node = network.nodes.lightning.find(
        n => n.implementation === 'LND',
      ) as LndNode;
      const newName = 'new-lnd-node-name';
      const updatedNode = await renameNode(network, node, newName);
      expect(updatedNode).toBeDefined();
      expect(updatedNode.name).toBe(newName);
      expect((updatedNode as LndNode).paths).toStrictEqual(
        getLndFilePaths(newName, network),
      );
    });

    it('should rename a lightning c-lightning node', async () => {
      const node = network.nodes.lightning.find(
        n => n.implementation === 'c-lightning',
      ) as CLightningNode;
      const newName = 'new-clightning-node-name';
      const updatedNode = await renameNode(network, node, newName);
      expect(updatedNode).toBeDefined();
      expect(updatedNode.name).toBe(newName);
      const supportsGrpc = (updatedNode as CLightningNode).ports.grpc !== 0;
      expect((updatedNode as CLightningNode).paths).toStrictEqual(
        getCLightningFilePaths(newName, supportsGrpc, network),
      );
    });

    it('should rename an Eclair node', async () => {
      const node = network.nodes.lightning.find(
        n => n.implementation === 'eclair',
      ) as EclairNode;
      expect(node).toBeDefined();
      const newName = 'new-eclair-node-name';
      const updatedNode = await renameNode(network, node, newName);
      expect(updatedNode).toBeDefined();
      expect(updatedNode.name).toBe(newName);
    });

    it('should rename a bitcoin node', async () => {
      const node = network.nodes.bitcoin[0] as BitcoinNode;
      const newName = 'new-bitcoin-node-name';
      const updatedNode = await renameNode(network, node, newName);
      expect(updatedNode).toBeDefined();
      expect(updatedNode.name).toBe(newName);
    });

    it('should rename a tap node', async () => {
      const lnd = createLndNetworkNode(
        network,
        defaultRepoState.images.LND.latest,
        defaultRepoState.images.LND.compatibility,
        { image: '', command: '' },
        Status.Stopped,
      );
      network.nodes.lightning.push(lnd);
      expect(network.nodes.lightning.length).toBe(5);
      const tap = createTapdNetworkNode(
        network,
        defaultRepoState.images.tapd.latest,
        defaultRepoState.images.tapd.compatibility,
        { image: '', command: '' },
        Status.Stopped,
      );
      network.nodes.tap.push(tap);
      expect(network.nodes.tap.length).toBe(1);

      const node = network.nodes.tap[0] as TapdNode;
      expect(node).toBeDefined();
      const newName = 'new-tap-node-name';

      const updatedNode = await renameNode(network, node, newName);
      expect(updatedNode).toBeDefined();
      expect(updatedNode.name).toBe(newName);
      expect((updatedNode as TapdNode).paths).toStrictEqual(
        getTapdFilePaths(newName, network),
      );
    });

    it('should throw an error for invalid node type', async () => {
      const invalidNode: any = { type: 'invalid', id: '123' };
      await expect(renameNode(network, invalidNode, 'new-name')).rejects.toThrow(
        'Invalid node type',
      );
    });

    it('should throw an error if node is not found', async () => {
      const nonExistentNode: any = { type: 'bitcoin', id: 'non-existent' };
      await expect(renameNode(network, nonExistentNode, 'new-name')).rejects.toThrow();
    });
  });
});
