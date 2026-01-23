import detectPort from 'detect-port';
import {
  BitcoinNode,
  CLightningNode,
  EclairNode,
  LightningNode,
  LitdNode,
  LndNode,
  NodeImplementation,
  Status,
  TapdNode,
} from 'shared/types';
import { Network } from 'types';
import { defaultRepoState } from './constants';
import {
  createBitcoindNetworkNode,
  createBtcdNetworkNode,
  createCLightningNetworkNode,
  createLitdNetworkNode,
  createLndNetworkNode,
  createNetwork,
  createTapdNetworkNode,
  filterCompatibleBackends,
  getCLightningFilePaths,
  getImageCommand,
  getInvoicePayload,
  getLndFilePaths,
  getOpenPortRange,
  getOpenPorts,
  getTapdFilePaths,
  mapToTapd,
  OpenPorts,
  renameNode,
} from './network';
import { getNetwork, testManagedImages, testNodeDocker } from './tests';

const mockDetectPort = detectPort as jest.Mock;

describe('Network Utils', () => {
  describe('getInvoicePayload', () => {
    const localNode: LightningNode = {
      id: 1,
      networkId: 1,
      name: 'Local Node',
      type: 'lightning',
      version: 'v0.1.0',
      docker: {
        image: 'lightning-node-image',
        command: 'start-node',
      },
      implementation: 'LND',
      backendName: 'Bitcoin Core',
      ports: {
        grpc: 10009,
        rest: 8080,
      },
      status: Status.Started,
    };

    const remoteNode: LightningNode = {
      id: 2,
      networkId: 1,
      name: 'Remote Node',
      type: 'lightning',
      version: 'v0.1.0',
      status: Status.Started,
      docker: {
        image: 'lightning-node-image',
        command: 'start-node',
      },
      implementation: 'LND',
      backendName: 'Bitcoin Core',
      ports: {
        grpc: 10010,
        rest: 8081,
      },
    };

    it('should return correct payload when local balance is greater than remote balance', () => {
      const channel = {
        pending: false,
        uniqueId: 'channel1',
        channelPoint: 'point1',
        pubkey: 'pubkey1',
        capacity: '1000',
        localBalance: '1000',
        remoteBalance: '500',
        status: 'Open' as const,
        isPrivate: false,
      };
      const nextLocalBalance = 800;
      const payload = getInvoicePayload(channel, localNode, remoteNode, nextLocalBalance);

      expect(payload.source).toBe(localNode);
      expect(payload.target).toBe(remoteNode);
      expect(payload.amount).toBe(200);
    });

    it('should return correct payload when local balance is less than next local balance', () => {
      const channel = {
        pending: false,
        uniqueId: 'channel2',
        channelPoint: 'point2',
        pubkey: 'pubkey2',
        capacity: '1000',
        localBalance: '800',
        remoteBalance: '1000',
        status: 'Open' as const,
        isPrivate: false,
      };

      const nextLocalBalance = 1000;
      const payload = getInvoicePayload(channel, localNode, remoteNode, nextLocalBalance);

      expect(payload.source).toBe(remoteNode);
      expect(payload.target).toBe(localNode);
      expect(payload.amount).toBe(200);
    });
  });

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
      network = createNetwork({
        id: 1,
        name: 'my-test',
        description: 'my-test-description',
        lndNodes: 2,
        clightningNodes: 1,
        eclairNodes: 1,
        bitcoindNodes: 1,
        btcdNodes: 1,
        tapdNodes: 0,
        litdNodes: 1,
        status: Status.Stopped,
        repoState: defaultRepoState,
        managedImages: testManagedImages,
        customImages: [],
        manualMineCount: 6,
      });
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
      expect(ports[network.nodes.lightning[4].name].grpc).toBe(10005);
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
      expect(ports[network.nodes.lightning[4].name].rest).toBe(8085);
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
      expect(ports[network.nodes.lightning[4].name].p2p).toBe(9739);
    });

    it('should update the p2p ports for litd nodes', async () => {
      const portsInUse = [9638];
      mockDetectPort.mockImplementation(port =>
        Promise.resolve(portsInUse.includes(port) ? port + 1 : port),
      );
      network.nodes.bitcoin = [];
      const ports = (await getOpenPorts(network)) as OpenPorts;
      expect(ports).toBeDefined();
      expect(ports[network.nodes.lightning[3].name].p2p).toBe(9639);
    });

    it('should update the web ports for litd nodes', async () => {
      const portsInUse = [8446];
      mockDetectPort.mockImplementation(port =>
        Promise.resolve(portsInUse.includes(port) ? port + 1 : port),
      );
      network.nodes.bitcoin = [];
      const ports = (await getOpenPorts(network)) as OpenPorts;
      expect(ports).toBeDefined();
      expect(ports[network.nodes.lightning[3].name].web).toBe(8447);
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
      const lnd2 = network.nodes.lightning[4] as LndNode;
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
        '0.19.1-beta',
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
      const btc = createBitcoindNetworkNode(
        network,
        '27.0',
        { image: '', command: '' },
        Status.Stopped,
      );
      network.nodes.bitcoin.push(btc);
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

  describe('createBtcdNetworkNode', () => {
    let network: Network;

    beforeEach(() => {
      network = createNetwork({
        id: 1,
        name: 'btcd-test',
        description: 'btcd test network',
        lndNodes: 0,
        clightningNodes: 0,
        eclairNodes: 0,
        bitcoindNodes: 0,
        btcdNodes: 0,
        tapdNodes: 0,
        litdNodes: 0,
        status: Status.Stopped,
        repoState: defaultRepoState,
        managedImages: testManagedImages,
        customImages: [],
        manualMineCount: 6,
      });
    });

    it('should create a btcd node with correct properties', () => {
      const btcd = createBtcdNetworkNode(
        network,
        '0.25.0',
        { image: '', command: '' },
        Status.Stopped,
      );
      expect(btcd.id).toBe(0);
      expect(btcd.networkId).toBe(1);
      expect(btcd.name).toBe('backend1');
      expect(btcd.type).toBe('bitcoin');
      expect(btcd.implementation).toBe('btcd');
      expect(btcd.version).toBe('0.25.0');
      expect(btcd.status).toBe(Status.Stopped);
      expect(btcd.peers).toEqual([]);
    });

    it('should allocate correct ports for btcd', () => {
      const btcd = createBtcdNetworkNode(
        network,
        '0.25.0',
        { image: '', command: '' },
        Status.Stopped,
      );
      // Base ports: grpc=18334, p2p=18444, btcdWallet=18332
      expect(btcd.ports.grpc).toBe(18334);
      expect(btcd.ports.p2p).toBe(18444);
      expect(btcd.ports.btcdWallet).toBe(18332);
      // btcd should NOT have zmq ports
      expect(btcd.ports.zmqBlock).toBeUndefined();
      expect(btcd.ports.zmqTx).toBeUndefined();
      expect(btcd.ports.rpc).toBeUndefined();
    });

    it('should auto-increment IDs for multiple btcd nodes', () => {
      const btcd1 = createBtcdNetworkNode(
        network,
        '0.25.0',
        { image: '', command: '' },
        Status.Stopped,
      );
      network.nodes.bitcoin.push(btcd1);

      const btcd2 = createBtcdNetworkNode(
        network,
        '0.25.0',
        { image: '', command: '' },
        Status.Stopped,
      );
      expect(btcd2.id).toBe(1);
      expect(btcd2.name).toBe('backend2');
      // Ports should be base + id (18334+1, 18444+1, 18332+1)
      expect(btcd2.ports.grpc).toBe(18335);
      expect(btcd2.ports.p2p).toBe(18445);
      expect(btcd2.ports.btcdWallet).toBe(18333);
    });

    it('should link peers between btcd nodes', () => {
      const btcd1 = createBtcdNetworkNode(
        network,
        '0.25.0',
        { image: '', command: '' },
        Status.Stopped,
      );
      network.nodes.bitcoin.push(btcd1);

      const btcd2 = createBtcdNetworkNode(
        network,
        '0.25.0',
        { image: '', command: '' },
        Status.Stopped,
      );

      // btcd2 should have btcd1 as peer
      expect(btcd2.peers).toContain('backend1');
      // btcd1 should have btcd2 as peer (bidirectional)
      expect(btcd1.peers).toContain('backend2');
    });

    it('should use custom docker image and command', () => {
      const btcd = createBtcdNetworkNode(
        network,
        '0.25.0',
        { image: 'custom-btcd:latest', command: 'custom-cmd' },
        Status.Stopped,
      );
      expect(btcd.docker.image).toBe('custom-btcd:latest');
      expect(btcd.docker.command).toBe('custom-cmd');
    });

    it('should create btcd node after bitcoind with correct ID', () => {
      // First add a bitcoind node
      const bitcoind = createBitcoindNetworkNode(
        network,
        '27.0',
        { image: '', command: '' },
        Status.Stopped,
      );
      network.nodes.bitcoin.push(bitcoind);

      // Then add a btcd node
      const btcd = createBtcdNetworkNode(
        network,
        '0.25.0',
        { image: '', command: '' },
        Status.Stopped,
      );

      expect(btcd.id).toBe(1);
      expect(btcd.name).toBe('backend2');
      // Should be peered with bitcoind
      expect(btcd.peers).toContain('backend1');
      expect(bitcoind.peers).toContain('backend2');
    });
  });

  describe('createNetwork with btcd', () => {
    it('should create a network with btcd nodes', () => {
      const network = createNetwork({
        id: 1,
        name: 'btcd-network',
        description: 'network with btcd',
        lndNodes: 0,
        clightningNodes: 0,
        eclairNodes: 0,
        bitcoindNodes: 0,
        btcdNodes: 2,
        tapdNodes: 0,
        litdNodes: 0,
        status: Status.Stopped,
        repoState: defaultRepoState,
        managedImages: testManagedImages,
        customImages: [],
        manualMineCount: 6,
      });

      expect(network.nodes.bitcoin.length).toBe(2);
      expect(network.nodes.bitcoin[0].implementation).toBe('btcd');
      expect(network.nodes.bitcoin[1].implementation).toBe('btcd');
      expect(network.nodes.bitcoin[0].name).toBe('backend1');
      expect(network.nodes.bitcoin[1].name).toBe('backend2');
    });

    it('should create a network with mixed bitcoind and btcd nodes', () => {
      const network = createNetwork({
        id: 1,
        name: 'mixed-network',
        description: 'network with both implementations',
        lndNodes: 0,
        clightningNodes: 0,
        eclairNodes: 0,
        bitcoindNodes: 1,
        btcdNodes: 1,
        tapdNodes: 0,
        litdNodes: 0,
        status: Status.Stopped,
        repoState: defaultRepoState,
        managedImages: testManagedImages,
        customImages: [],
        manualMineCount: 6,
      });

      expect(network.nodes.bitcoin.length).toBe(2);
      // bitcoind is added first
      expect(network.nodes.bitcoin[0].implementation).toBe('bitcoind');
      expect(network.nodes.bitcoin[1].implementation).toBe('btcd');
      // They should be peered
      expect(network.nodes.bitcoin[0].peers).toContain('backend2');
      expect(network.nodes.bitcoin[1].peers).toContain('backend1');
    });

    it('should use correct btcd image version from repoState', () => {
      const network = createNetwork({
        id: 1,
        name: 'btcd-version-test',
        description: 'test btcd version',
        lndNodes: 0,
        clightningNodes: 0,
        eclairNodes: 0,
        bitcoindNodes: 0,
        btcdNodes: 1,
        tapdNodes: 0,
        litdNodes: 0,
        status: Status.Stopped,
        repoState: defaultRepoState,
        managedImages: testManagedImages,
        customImages: [],
        manualMineCount: 6,
      });

      expect(network.nodes.bitcoin[0].version).toBe(defaultRepoState.images.btcd.latest);
    });
  });

  describe('renameNode', () => {
    let network: Network;

    beforeEach(() => {
      network = createNetwork({
        id: 1,
        name: 'my-test',
        description: 'my-test-description',
        lndNodes: 2,
        clightningNodes: 1,
        eclairNodes: 1,
        bitcoindNodes: 1,
        btcdNodes: 1,
        tapdNodes: 0,
        litdNodes: 1,
        status: Status.Stopped,
        repoState: defaultRepoState,
        managedImages: testManagedImages,
        customImages: [],
        manualMineCount: 6,
      });
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

    it('should rename a litd node', async () => {
      const node = network.nodes.lightning.find(
        n => n.implementation === 'litd',
      ) as LitdNode;
      expect(node).toBeDefined();
      const newName = 'new-litd-node-name';
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

    it('should rename a btcd node', async () => {
      // Add a btcd node to the network
      const btcd = createBtcdNetworkNode(
        network,
        '0.25.0',
        { image: '', command: '' },
        Status.Stopped,
      );
      network.nodes.bitcoin.push(btcd);

      const newName = 'new-btcd-node-name';
      const updatedNode = await renameNode(network, btcd, newName);
      expect(updatedNode).toBeDefined();
      expect(updatedNode.name).toBe(newName);
      expect(updatedNode.implementation).toBe('btcd');
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
      expect(network.nodes.lightning.length).toBe(6);
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

  describe('filterCompatibleBackends', () => {
    let network: Network;
    let bitcoindNode: BitcoinNode;
    let btcdNode: BitcoinNode;

    beforeEach(() => {
      network = getNetwork();
      // Clear existing bitcoin nodes so we have full control
      network.nodes.bitcoin = [];
      // Create one bitcoind and one btcd node
      bitcoindNode = createBitcoindNetworkNode(
        network,
        '27.0',
        { image: '', command: '' },
        Status.Stopped,
      );
      network.nodes.bitcoin.push(bitcoindNode);
      btcdNode = createBtcdNetworkNode(
        network,
        '0.25.0',
        { image: '', command: '' },
        Status.Stopped,
      );
      network.nodes.bitcoin.push(btcdNode);
    });

    it('should allow btcd backend for LND', () => {
      const backends = filterCompatibleBackends(
        'LND',
        '0.18.0-beta',
        undefined,
        network.nodes.bitcoin,
      );
      // Should include both bitcoind and btcd
      expect(backends.length).toBe(2);
      expect(backends.map(b => b.implementation)).toContain('bitcoind');
      expect(backends.map(b => b.implementation)).toContain('btcd');
    });

    it('should allow btcd backend for litd', () => {
      const backends = filterCompatibleBackends(
        'litd',
        '0.14.0-alpha',
        undefined,
        network.nodes.bitcoin,
      );
      // Should include both bitcoind and btcd
      expect(backends.length).toBe(2);
      expect(backends.map(b => b.implementation)).toContain('bitcoind');
      expect(backends.map(b => b.implementation)).toContain('btcd');
    });

    it('should NOT allow btcd backend for c-lightning', () => {
      const backends = filterCompatibleBackends(
        'c-lightning',
        '24.05',
        undefined,
        network.nodes.bitcoin,
      );
      // Should only include bitcoind
      expect(backends.length).toBe(1);
      expect(backends[0].implementation).toBe('bitcoind');
      expect(backends.map(b => b.implementation)).not.toContain('btcd');
    });

    it('should NOT allow btcd backend for eclair', () => {
      const backends = filterCompatibleBackends(
        'eclair',
        '0.10.0',
        undefined,
        network.nodes.bitcoin,
      );
      // Should only include bitcoind
      expect(backends.length).toBe(1);
      expect(backends[0].implementation).toBe('bitcoind');
      expect(backends.map(b => b.implementation)).not.toContain('btcd');
    });

    it('should return only bitcoind for CLN even with compatibility undefined', () => {
      const backends = filterCompatibleBackends(
        'c-lightning',
        '24.05',
        undefined,
        network.nodes.bitcoin,
      );
      expect(backends.every(b => b.implementation === 'bitcoind')).toBe(true);
    });

    it('should return only bitcoind for eclair even with compatibility undefined', () => {
      const backends = filterCompatibleBackends(
        'eclair',
        '0.10.0',
        undefined,
        network.nodes.bitcoin,
      );
      expect(backends.every(b => b.implementation === 'bitcoind')).toBe(true);
    });
  });

  describe('mapToTapd', () => {
    let network: Network;
    let litd: LitdNode;

    beforeEach(() => {
      network = getNetwork();
      litd = createLitdNetworkNode(
        network,
        defaultRepoState.images.litd.latest,
        defaultRepoState.images.litd.compatibility,
        testNodeDocker,
      );
    });

    it('should map a litd node to a tapd node', () => {
      const tapd = mapToTapd(litd);
      expect(tapd).toBeDefined();
      expect(tapd.id).toBe(litd.id);
      expect(tapd.name).toBe(litd.name);
      expect(tapd.type).toBe('tap');
      expect(tapd.implementation).toBe('litd');
      expect(tapd.ports.grpc).toBe(litd.ports.web);
      expect(tapd.ports.rest).toBe(litd.ports.rest);
    });

    it('should throw an error if the node is not a litd node', () => {
      const lnd = createLndNetworkNode(
        network,
        defaultRepoState.images.LND.latest,
        defaultRepoState.images.LND.compatibility,
        testNodeDocker,
      );
      expect(() => mapToTapd(lnd)).toThrow(`Node "${lnd.name}" is not a litd node`);
    });
  });
});
