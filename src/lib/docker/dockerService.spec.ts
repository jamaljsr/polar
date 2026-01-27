import * as electron from 'electron';
import * as fs from 'fs-extra';
import { join } from 'path';
import { IChart } from '@mrblenny/react-flow-chart';
import { v2 as compose } from 'docker-compose';
import Dockerode from 'dockerode';
import os from 'os';
import { CLightningNode, LitdNode, LndNode, Status, TapdNode } from 'shared/types';
import { dockerService } from 'lib/docker';
import { Network, NetworksFile } from 'types';
import { initChartFromNetwork } from 'utils/chart';
import { networksPath } from 'utils/config';
import { APP_VERSION, defaultRepoState, DOCKER_REPO } from 'utils/constants';
import * as files from 'utils/files';
import { createNetwork } from 'utils/network';
import { getNetwork, mockProperty, testManagedImages } from 'utils/tests';
import { getDocker } from './dockerService';

jest.mock('dockerode');
jest.mock('os');
jest.mock('utils/files', () => ({
  write: jest.fn(),
  read: jest.fn(),
  exists: jest.fn(),
  renameFile: jest.fn(),
  rm: jest.fn(),
}));

const mockOS = os as jest.Mocked<typeof os>;
const fsMock = fs as jest.Mocked<typeof fs>;
const filesMock = files as jest.Mocked<typeof files>;
const composeMock = compose as jest.Mocked<typeof compose>;
const electronMock = electron as jest.Mocked<typeof electron>;
const mockDockerode = Dockerode as unknown as jest.Mock<Dockerode>;

describe('DockerService', () => {
  let network: Network;
  // default response of docker calls for mocks
  const mockResult = { err: '', out: '', exitCode: 0 };

  beforeEach(() => {
    network = getNetwork();
  });

  it('should populate env vars with compose commands', async () => {
    Object.defineProperty(electronMock.remote.process, 'env', {
      get: () => ({
        __TESTVAR: 'TESTVAL',
      }),
    });
    await dockerService.getVersions();
    expect(composeMock.version).toHaveBeenCalledWith(
      expect.objectContaining({
        env: expect.objectContaining({ __TESTVAR: 'TESTVAL' }),
      }),
      undefined,
    );
  });

  it('should populate UID/GID env vars when running on linux', async () => {
    mockOS.platform.mockReturnValue('linux');
    mockOS.userInfo.mockReturnValue({ uid: '999', gid: '999' } as any);
    await dockerService.getVersions();
    expect(composeMock.version).toHaveBeenCalledWith(
      expect.objectContaining({
        env: expect.objectContaining({ USERID: '999', GROUPID: '999' }),
      }),
      undefined,
    );
  });

  describe('detecting versions', () => {
    const dockerVersion = mockDockerode.prototype.version;
    const composeVersion = composeMock.version;
    const versionResult = { ...mockResult, out: '4.5.6', data: { version: '4.5.6' } };

    it('should get both versions successfully', async () => {
      dockerVersion.mockResolvedValue({ Version: '1.2.3' });
      composeVersion.mockResolvedValue(versionResult);
      const versions = await dockerService.getVersions(true);
      expect(versions.docker).toBe('1.2.3');
      expect(versions.compose).toBe('4.5.6');
    });

    it('should return default values if both throw errors', async () => {
      dockerVersion.mockRejectedValue(new Error('docker-error'));
      composeVersion.mockRejectedValue(new Error('compose-error'));
      const versions = await dockerService.getVersions();
      expect(versions.docker).toBe('');
      expect(versions.compose).toBe('');
    });

    it('should return compose version if docker version fails', async () => {
      dockerVersion.mockRejectedValue(new Error('docker-error'));
      composeVersion.mockResolvedValue(versionResult);
      const versions = await dockerService.getVersions();
      expect(versions.docker).toBe('');
      expect(versions.compose).toBe('4.5.6');
    });

    it('should return docker version if docker compose fails', async () => {
      dockerVersion.mockResolvedValue({ Version: '1.2.3' });
      composeVersion.mockRejectedValue(new Error('compose-error'));
      const versions = await dockerService.getVersions();
      expect(versions.docker).toBe('1.2.3');
      expect(versions.compose).toBe('');
    });

    it('should throw an error if docker version fails', async () => {
      dockerVersion.mockRejectedValue(new Error('docker-error'));
      composeVersion.mockResolvedValue(versionResult);
      await expect(dockerService.getVersions(true)).rejects.toThrow('docker-error');
    });

    it('should throw an error if compose version fails', async () => {
      dockerVersion.mockResolvedValue({ Version: '1.2.3' });
      composeVersion.mockRejectedValue({ err: 'compose-error' });
      await expect(dockerService.getVersions(true)).rejects.toThrow('compose-error');
    });
  });

  describe('getting images', () => {
    const dockerListImages = mockDockerode.prototype.listImages;
    const polar = (name: string) => `${DOCKER_REPO}/${name}`;
    const mapResponse = (names: string[]) => names.map(name => ({ RepoTags: [name] }));

    it('should return a list of all docker images', async () => {
      dockerListImages.mockResolvedValue(mapResponse([polar('aaa'), polar('bbb')]));
      expect(await dockerService.getImages()).toEqual([polar('aaa'), polar('bbb')]);
    });

    it('should return images that do not start with the prefix', async () => {
      dockerListImages.mockResolvedValue(mapResponse(['other1', polar('aaa'), 'other2']));
      expect(await dockerService.getImages()).toEqual(['other1', polar('aaa'), 'other2']);
    });

    it('should return an empty list if the fetch fails', async () => {
      dockerListImages.mockRejectedValue(new Error('test-error'));
      expect(await dockerService.getImages()).toEqual([]);
    });

    it('should handle untagged images', async () => {
      dockerListImages.mockResolvedValue([
        ...mapResponse([polar('aaa'), polar('bbb')]),
        { RepoTags: undefined },
      ]);
      expect(await dockerService.getImages()).toEqual([polar('aaa'), polar('bbb')]);
    });
  });

  describe('saving data', () => {
    it('should save the docker-compose.yml file', () => {
      dockerService.saveComposeFile(network);

      expect(filesMock.write).toHaveBeenCalledWith(
        expect.stringContaining('docker-compose.yml'),
        expect.stringContaining('services:'),
      );
    });

    it('should save with the bitcoin node in the compose file', () => {
      dockerService.saveComposeFile(network);
      expect(filesMock.write).toHaveBeenCalledWith(
        expect.stringContaining('docker-compose.yml'),
        expect.stringContaining(
          `container_name: polar-n1-${network.nodes.bitcoin[0].name}`,
        ),
      );
    });

    it('should save with the lnd node in the compose file', () => {
      dockerService.saveComposeFile(network);
      expect(filesMock.write).toHaveBeenCalledWith(
        expect.stringContaining('docker-compose.yml'),
        expect.stringContaining(
          `container_name: polar-n1-${network.nodes.lightning[0].name}`,
        ),
      );
    });

    it('should save the lnd node with the first bitcoin node as backend', () => {
      const net = createNetwork({
        id: 1,
        name: 'my network',
        description: 'network description',
        lndNodes: 1,
        clightningNodes: 0,
        eclairNodes: 0,
        bitcoindNodes: 1,
        btcdNodes: 0,
        tapdNodes: 0,
        litdNodes: 0,
        repoState: defaultRepoState,
        managedImages: testManagedImages,
        customImages: [],
        manualMineCount: 6,
      });
      net.nodes.lightning[0].backendName = 'invalid';
      dockerService.saveComposeFile(net);
      expect(filesMock.write).toHaveBeenCalledWith(
        expect.stringContaining('docker-compose.yml'),
        expect.stringContaining(
          `container_name: polar-n1-${network.nodes.lightning[0].name}`,
        ),
      );
    });

    it('should save the c-lightning node with the first bitcoin node as backend', () => {
      const net = createNetwork({
        id: 1,
        name: 'my network',
        description: 'network description',
        lndNodes: 0,
        clightningNodes: 1,
        eclairNodes: 0,
        bitcoindNodes: 1,
        btcdNodes: 0,
        tapdNodes: 0,
        litdNodes: 0,
        repoState: defaultRepoState,
        managedImages: testManagedImages,
        customImages: [],
        manualMineCount: 6,
      });
      net.nodes.lightning[0].backendName = 'invalid';
      dockerService.saveComposeFile(net);
      expect(filesMock.write).toHaveBeenCalledWith(
        expect.stringContaining('docker-compose.yml'),
        expect.stringContaining(
          `container_name: polar-n1-${network.nodes.lightning[0].name}`,
        ),
      );
    });

    it('should save the eclair node with the first bitcoin node as backend', () => {
      const net = createNetwork({
        id: 1,
        name: 'my network',
        description: 'network description',
        lndNodes: 0,
        clightningNodes: 0,
        eclairNodes: 1,
        bitcoindNodes: 1,
        btcdNodes: 0,
        tapdNodes: 0,
        litdNodes: 0,
        repoState: defaultRepoState,
        managedImages: testManagedImages,
        customImages: [],
        manualMineCount: 6,
      });
      net.nodes.lightning[0].backendName = 'invalid';
      dockerService.saveComposeFile(net);
      expect(filesMock.write).toHaveBeenCalledWith(
        expect.stringContaining('docker-compose.yml'),
        expect.stringContaining(
          `container_name: polar-n1-${network.nodes.lightning[0].name}`,
        ),
      );
    });

    it('should not save unknown lightning implementation', () => {
      network.nodes.lightning[0].implementation = 'unknown' as any;
      dockerService.saveComposeFile(network);
      expect(filesMock.write).toHaveBeenCalledWith(
        expect.stringContaining('docker-compose.yml'),
        expect.not.stringContaining(
          `container_name: polar-n1-${network.nodes.lightning[0].name}`,
        ),
      );
    });

    it('should save the tapd node with the named LND node as backend', () => {
      const net = getNetwork(1, 'my network', undefined, 2);
      dockerService.saveComposeFile(net);
      expect(filesMock.write).toHaveBeenCalledWith(
        expect.stringContaining('docker-compose.yml'),
        expect.stringContaining(`--lnd.host=polar-n1-${net.nodes.lightning[1].name}`),
      );
    });

    it('should save the tapd node with the first LND node as backend', () => {
      const net = getNetwork(1, 'my network', undefined, 2);
      const tapNode = net.nodes.tap[0] as TapdNode;
      tapNode.lndName = 'invalid';
      dockerService.saveComposeFile(net);
      expect(filesMock.write).toHaveBeenCalledWith(
        expect.stringContaining('docker-compose.yml'),
        expect.stringContaining(`--lnd.host=polar-n1-${net.nodes.lightning[0].name}`),
      );
    });

    it('should not save unknown tap implementation', () => {
      const net = getNetwork(1, 'my network', undefined, 2);
      net.nodes.tap[0].implementation = 'unknown' as any;
      dockerService.saveComposeFile(net);
      expect(filesMock.write).toHaveBeenCalledWith(
        expect.stringContaining('docker-compose.yml'),
        expect.not.stringContaining(`container_name: polar-n1-${net.nodes.tap[0].name}`),
      );
    });

    it('should save with btcd node in the compose file', () => {
      const net = createNetwork({
        id: 1,
        name: 'btcd network',
        description: 'network with btcd',
        lndNodes: 1,
        clightningNodes: 0,
        eclairNodes: 0,
        bitcoindNodes: 0,
        btcdNodes: 1,
        tapdNodes: 0,
        litdNodes: 0,
        repoState: defaultRepoState,
        managedImages: testManagedImages,
        customImages: [],
        manualMineCount: 6,
      });
      dockerService.saveComposeFile(net);
      expect(filesMock.write).toHaveBeenCalledWith(
        expect.stringContaining('docker-compose.yml'),
        expect.stringContaining(`container_name: polar-n1-${net.nodes.bitcoin[0].name}`),
      );
    });

    it('should save the litd node with the named LND node as backend', () => {
      const net = createNetwork({
        id: 1,
        name: 'my network',
        description: 'network description',
        lndNodes: 0,
        clightningNodes: 0,
        eclairNodes: 0,
        bitcoindNodes: 1,
        btcdNodes: 0,
        tapdNodes: 0,
        litdNodes: 1,
        repoState: defaultRepoState,
        managedImages: testManagedImages,
        customImages: [],
        manualMineCount: 6,
      });
      dockerService.saveComposeFile(net);
      const { backendName } = net.nodes.lightning[0] as LitdNode;
      expect(filesMock.write).toHaveBeenCalledWith(
        expect.stringContaining('docker-compose.yml'),
        expect.stringContaining(`--lnd.bitcoind.rpchost=polar-n1-${backendName}`),
      );
    });

    it('should save the litd node with the first bitcoin node as backend', () => {
      const net = createNetwork({
        id: 1,
        name: 'my network',
        description: 'network description',
        lndNodes: 0,
        clightningNodes: 0,
        eclairNodes: 0,
        bitcoindNodes: 1,
        btcdNodes: 0,
        tapdNodes: 0,
        litdNodes: 1,
        repoState: defaultRepoState,
        managedImages: testManagedImages,
        customImages: [],
        manualMineCount: 6,
      });
      const litdNode = net.nodes.lightning[0] as LitdNode;
      litdNode.backendName = 'invalid';
      dockerService.saveComposeFile(net);
      expect(filesMock.write).toHaveBeenCalledWith(
        expect.stringContaining('docker-compose.yml'),
        expect.stringContaining(
          `--lnd.bitcoind.rpchost=polar-n1-${net.nodes.bitcoin[0].name}`,
        ),
      );
    });

    it('should not save unknown litd implementation', () => {
      const net = createNetwork({
        id: 1,
        name: 'my network',
        description: 'network description',
        lndNodes: 0,
        clightningNodes: 0,
        eclairNodes: 0,
        bitcoindNodes: 1,
        btcdNodes: 0,
        tapdNodes: 0,
        litdNodes: 1,
        repoState: defaultRepoState,
        managedImages: testManagedImages,
        customImages: [],
        manualMineCount: 6,
      });
      net.nodes.lightning[0].implementation = 'unknown' as any;
      dockerService.saveComposeFile(net);
      expect(filesMock.write).toHaveBeenCalledWith(
        expect.stringContaining('docker-compose.yml'),
        expect.not.stringContaining(
          `container_name: polar-n1-${net.nodes.lightning[0].name}`,
        ),
      );
    });

    it('should save a list of networks to disk', () => {
      dockerService.saveNetworks({ version: '0.1.0', networks: [network], charts: {} });
      expect(filesMock.write).toHaveBeenCalledWith(
        expect.stringContaining(join('networks', 'networks.json')),
        expect.stringContaining(`"name": "${network.name}"`),
      );
    });
  });

  describe('loading data', () => {
    const createTestNetwork = () => {
      const net = createNetwork({
        id: 1,
        name: 'my network',
        description: 'network description',
        lndNodes: 2,
        clightningNodes: 1,
        eclairNodes: 0,
        bitcoindNodes: 1,
        btcdNodes: 0,
        tapdNodes: 0,
        litdNodes: 0,
        repoState: defaultRepoState,
        managedImages: testManagedImages,
        customImages: [],
        manualMineCount: 6,
      });
      const chart = initChartFromNetwork(net);
      // return 'any' to suppress "The operand of a 'delete' operator must be optional.ts(2790)" error
      return { net, chart } as any;
    };

    const create010Network = () => {
      const { net, chart } = createTestNetwork();
      // added in v0.2.0
      net.path = 'ELECTRON_PATH[userData]/data/networks/1';
      delete net.nodes.bitcoin[0].peers;
      const { name } = net.nodes.bitcoin[0];
      delete chart.nodes[name].ports['peer-left'];
      delete chart.nodes[name].ports['peer-right'];
      net.nodes.lightning.forEach((n: any) => {
        if (n.implementation === 'LND') {
          (
            n as LndNode
          ).paths.tlsCert = `ELECTRON_PATH[userData]/data/networks/1/volumes/lnd/${n.name}/tls.cert`;
        }
      });
      return { net, chart };
    };

    const create020Network = () => {
      const { net, chart } = createTestNetwork();
      // added in v0.3.0
      net.nodes.bitcoin.forEach((n: any) => {
        delete n.docker;
        delete n.ports.zmqBlock;
        delete n.ports.zmqTx;
      });
      net.nodes.lightning.forEach((n: any) => {
        delete n.docker;
        delete n.ports.p2p;
        // the old LND logo url
        chart.nodes[n.name].properties.icon = '/static/media/lnd.935c28bc.png';
      });
      return { net, chart };
    };

    const createTestNetworkWithBtcd = () => {
      const net = createNetwork({
        id: 1,
        name: 'my network',
        description: 'network description',
        lndNodes: 2,
        clightningNodes: 0,
        eclairNodes: 0,
        bitcoindNodes: 0,
        btcdNodes: 1,
        tapdNodes: 0,
        litdNodes: 0,
        repoState: defaultRepoState,
        managedImages: testManagedImages,
        customImages: [],
        manualMineCount: 6,
      });
      const chart = initChartFromNetwork(net);
      return { net, chart } as any;
    };

    const create020NetworkWithBtcd = () => {
      const { net, chart } = createTestNetworkWithBtcd();
      // added in v0.3.0
      net.nodes.bitcoin.forEach((n: any) => {
        delete n.docker;
        // btcd doesn't have zmq ports, but delete them if they exist
        delete n.ports.zmqBlock;
        delete n.ports.zmqTx;
      });
      net.nodes.lightning.forEach((n: any) => {
        delete n.docker;
        delete n.ports.p2p;
        chart.nodes[n.name].properties.icon = '/static/media/lnd.935c28bc.png';
      });
      return { net, chart };
    };

    const create101Network = () => {
      const { net, chart } = createTestNetwork();
      // added in v1.1.0
      net.nodes.bitcoin.forEach((n: any) => {
        delete n.ports.p2p;
      });
      net.nodes.lightning.forEach((n: any) => {
        if (n.implementation === 'LND') {
          delete n.paths.invoiceMacaroon;
        }
      });
      return { net, chart };
    };

    const create130Network = () => {
      const { net, chart } = createTestNetwork();
      net.nodes.lightning.forEach((n: any) => {
        if (n.implementation === 'c-lightning') {
          // removed in v1.4.0
          n.paths.tlsKey = 'dummy key';
          // added in v1.4.0
          delete n.paths.tlsClientCert;
          delete n.paths.tlsClientKey;
        }
      });
      return { net, chart };
    };

    const create141Network = () => {
      const { net, chart } = createTestNetwork();
      // added in v2.0.0
      delete net.autoMineMode;
      delete net.nodes.tap;
      net.nodes.lightning.forEach((n: any) => {
        if (n.implementation === 'LND') {
          delete chart.nodes[n.name].ports['lndbackend'];
        }
      });
      return { net, chart };
    };

    const createLegacyNetworksFile = (version = '0.1.0') => {
      let res: { net: Network; chart: IChart };

      switch (version) {
        case '0.1.0':
          res = create010Network();
          break;
        case '0.2.0':
          res = create020Network();
          break;
        case '1.0.1':
          res = create101Network();
          break;
        case '1.3.0':
          res = create130Network();
          break;
        case '1.4.1':
          res = create141Network();
          break;
        default:
          res = createTestNetwork();
          break;
      }

      const fileData: NetworksFile = {
        version,
        networks: [res.net],
        charts: {
          [network.id]: res.chart,
        },
      };
      return JSON.stringify(fileData);
    };

    const createCurrentNetworksFile = () => {
      const net = createNetwork({
        id: 1,
        name: 'my network',
        description: 'network description',
        lndNodes: 2,
        clightningNodes: 1,
        eclairNodes: 0,
        bitcoindNodes: 1,
        btcdNodes: 0,
        tapdNodes: 0,
        litdNodes: 0,
        repoState: defaultRepoState,
        managedImages: testManagedImages,
        customImages: [],
        manualMineCount: 6,
      });
      const chart = initChartFromNetwork(net);
      const fileData: NetworksFile = {
        version: `${APP_VERSION}`,
        networks: [net],
        charts: {
          [network.id]: chart,
        },
      };
      return fileData;
    };

    it('should load the list of networks from disk', async () => {
      filesMock.exists.mockResolvedValue(true);
      const fileData = `{ "version": "${APP_VERSION}", "networks": [], "charts": {} }`;
      filesMock.read.mockResolvedValue(fileData);
      const { networks } = await dockerService.loadNetworks();
      expect(networks.length).toBe(0);
      expect(filesMock.read).toHaveBeenCalledWith(
        expect.stringContaining(join('networks', 'networks.json')),
      );
    });

    it('should return an empty list if no networks are saved', async () => {
      filesMock.exists.mockResolvedValue(false);
      const { networks } = await dockerService.loadNetworks();
      expect(Array.isArray(networks)).toBe(true);
      expect(networks.length).toBe(0);
    });

    it('should return an empty list if no networks are saved', async () => {
      filesMock.exists.mockResolvedValue(true);
      filesMock.read.mockResolvedValue('');
      const { networks } = await dockerService.loadNetworks();
      expect(Array.isArray(networks)).toBe(true);
      expect(networks.length).toBe(0);
    });

    it('should copy networks folder from an older version', async () => {
      filesMock.exists.mockResolvedValueOnce(true); // legacy path
      filesMock.exists.mockResolvedValueOnce(false); // current path before copy
      filesMock.exists.mockResolvedValueOnce(true); // current path after copy
      filesMock.read.mockResolvedValue(createLegacyNetworksFile());
      const { networks, version } = await dockerService.loadNetworks();
      expect(version).toEqual(APP_VERSION);
      expect(networks.length).toBe(1);
      expect(networks[0].path).toEqual(join(networksPath, `${networks[0].id}`));
    });

    it('should not throw if older version folder fails to copy', async () => {
      filesMock.exists.mockResolvedValueOnce(true); // legacy path
      filesMock.exists.mockResolvedValueOnce(false); // current path before copy
      fsMock.copy.mockRejectedValue(new Error('test-error') as never);
      filesMock.exists.mockResolvedValueOnce(true); // current path after copy
      filesMock.read.mockResolvedValue(createLegacyNetworksFile());
      const { networks, version } = await dockerService.loadNetworks();
      expect(version).toEqual(APP_VERSION);
      expect(networks.length).toBe(1);
      expect(networks[0].path).toEqual(join(networksPath, `${networks[0].id}`));
    });

    it('should migrate network data from v0.1.0', async () => {
      filesMock.exists.mockResolvedValue(true);
      filesMock.read.mockResolvedValue(createLegacyNetworksFile('0.1.0'));
      const { networks, charts, version } = await dockerService.loadNetworks();
      const btcNode = networks[0].nodes.bitcoin[0];
      const chart = charts[networks[0].id];
      expect(version).toEqual(APP_VERSION);
      // added in v0.2.0
      expect(networks[0].path).toEqual(join(networksPath, `${networks[0].id}`));
      expect(btcNode.peers).toEqual([]);
      expect(chart.nodes[btcNode.name].ports['peer-left']).toBeDefined();
      expect(chart.nodes[btcNode.name].ports['peer-right']).toBeDefined();
    });

    it('should migrate network data from v0.2.0', async () => {
      filesMock.exists.mockResolvedValue(true);
      filesMock.read.mockResolvedValue(createLegacyNetworksFile('0.2.0'));
      const { networks, version } = await dockerService.loadNetworks();
      const btcNode = networks[0].nodes.bitcoin[0];
      expect(version).toEqual(APP_VERSION);
      // added in v0.3.0
      expect(btcNode.docker).toBeDefined();
      expect(btcNode.ports.zmqBlock).toBeDefined();
      expect(btcNode.ports.zmqTx).toBeDefined();
      networks[0].nodes.lightning.forEach(n => {
        expect(n.docker).toBeDefined();
        expect(n.ports.p2p).toBeDefined();
      });
    });

    it('should migrate network data from v0.2.0 with btcd node', async () => {
      filesMock.exists.mockResolvedValue(true);
      const { net, chart } = create020NetworkWithBtcd();
      const fileData: NetworksFile = {
        version: '0.2.0',
        networks: [net],
        charts: { [network.id]: chart },
      };
      filesMock.read.mockResolvedValue(JSON.stringify(fileData));
      const { networks, version } = await dockerService.loadNetworks();
      const btcNode = networks[0].nodes.bitcoin[0];
      expect(version).toEqual(APP_VERSION);
      // added in v0.3.0
      expect(btcNode.docker).toBeDefined();
      // btcd nodes should NOT have zmq ports added
      expect(btcNode.ports.zmqBlock).toBeUndefined();
      expect(btcNode.ports.zmqTx).toBeUndefined();
      networks[0].nodes.lightning.forEach(n => {
        expect(n.docker).toBeDefined();
        expect(n.ports.p2p).toBeDefined();
      });
    });

    it('should migrate network data from v1.0.1', async () => {
      filesMock.exists.mockResolvedValue(true);
      filesMock.read.mockResolvedValue(createLegacyNetworksFile('1.0.1'));
      const { networks, version } = await dockerService.loadNetworks();
      const btcNode = networks[0].nodes.bitcoin[0];
      expect(version).toEqual(APP_VERSION);
      // added in v1.1.0
      expect(btcNode.ports.p2p).toBeDefined();
      networks[0].nodes.lightning.forEach(n => {
        if (n.implementation === 'LND') {
          expect((n as LndNode).paths.invoiceMacaroon).toBeDefined();
        }
      });
    });

    it('should migrate network data from v1.3.0', async () => {
      filesMock.exists.mockResolvedValue(true);
      filesMock.read.mockResolvedValue(createLegacyNetworksFile('1.3.0'));
      const { networks, version } = await dockerService.loadNetworks();
      expect(version).toEqual(APP_VERSION);
      // added in v1.4.0
      networks[0].nodes.lightning.forEach(n => {
        if (n.implementation === 'c-lightning') {
          expect((n as any).paths.tlsKey).toBeUndefined();
          expect((n as CLightningNode).paths.tlsCert).toBeDefined();
          expect((n as CLightningNode).paths.tlsClientCert).toBeDefined();
          expect((n as CLightningNode).paths.tlsClientKey).toBeDefined();
        }
      });
    });

    it('should migrate network data from v2.0.0', async () => {
      filesMock.exists.mockResolvedValue(true);
      filesMock.read.mockResolvedValue(createLegacyNetworksFile('1.4.1'));
      const { networks, version } = await dockerService.loadNetworks();
      expect(version).toEqual(APP_VERSION);
      // added in v2.0.0
      expect(networks[0].autoMineMode).toBeDefined();
      expect(networks[0].nodes.tap).toBeDefined();
    });

    it('should not run migrations in production with up to date version', async () => {
      mockProperty(process, 'env', { NODE_ENV: 'production' } as any);
      const file = createCurrentNetworksFile();
      filesMock.exists.mockResolvedValue(true);
      filesMock.read.mockResolvedValue(JSON.stringify(file));
      const result = await dockerService.loadNetworks();
      expect(result).toEqual(file);
      mockProperty(process, 'env', { NODE_ENV: 'test' } as any);
    });

    it('should not modify a current network if migrated', async () => {
      const file = createCurrentNetworksFile();
      file.version = '0.0.0'; // induce a migration to run
      filesMock.exists.mockResolvedValue(true);
      filesMock.read.mockResolvedValue(JSON.stringify(file));
      const { networks, charts, version } = await dockerService.loadNetworks();
      expect(version).toEqual(APP_VERSION);
      expect(networks).toEqual(file.networks);
      expect(charts).toEqual(file.charts);
    });

    it('should not throw an error if migration fails', async () => {
      filesMock.exists.mockResolvedValue(true);
      const file = JSON.parse(createLegacyNetworksFile('0.1.0'));
      file.networks[0] = 'a string instead of a network'; // induce migration error
      const json = JSON.stringify(file);
      filesMock.read.mockResolvedValue(json);
      const { version } = await dockerService.loadNetworks();
      expect(version).toEqual('0.1.0');
    });
  });

  describe('executing commands', () => {
    it('should call compose.upAll when a network is started', async () => {
      composeMock.upAll.mockResolvedValue(mockResult);
      await dockerService.start(network);
      expect(composeMock.upAll).toHaveBeenCalledWith(
        expect.objectContaining({ cwd: network.path }),
        undefined,
      );
    });

    it('should create volume dirs when the network is started', async () => {
      composeMock.upAll.mockResolvedValue(mockResult);
      await dockerService.start(network);
      expect(fsMock.ensureDir).toHaveBeenCalledTimes(7);
    });

    it('should create volume dirs when the network is started', async () => {
      const net = createNetwork({
        id: 1,
        name: 'my network',
        description: 'network description',
        lndNodes: 1,
        clightningNodes: 1,
        eclairNodes: 0,
        bitcoindNodes: 1,
        btcdNodes: 0,
        tapdNodes: 0,
        litdNodes: 1,
        repoState: defaultRepoState,
        managedImages: testManagedImages,
        customImages: [],
        manualMineCount: 6,
      });
      composeMock.upAll.mockResolvedValue(mockResult);
      await dockerService.start(net);
      expect(fsMock.ensureDir).toHaveBeenCalledTimes(9);
    });

    it('should call compose.down when a network is stopped', async () => {
      composeMock.down.mockResolvedValue(mockResult);
      await dockerService.stop(network);
      expect(composeMock.down).toHaveBeenCalledWith(
        expect.objectContaining({ cwd: network.path }),
        undefined,
      );
    });

    it('should call compose.upOne when a node is started', async () => {
      composeMock.stopOne.mockResolvedValue(mockResult);
      composeMock.upOne.mockResolvedValue(mockResult);
      const node = network.nodes.lightning[0];
      await dockerService.startNode(network, node);
      expect(composeMock.upOne).toHaveBeenCalledWith(
        node.name,
        expect.objectContaining({ cwd: network.path }),
      );
    });

    it('should call compose.stopOne when a node is stopped', async () => {
      composeMock.stopOne.mockResolvedValue(mockResult);
      const node = network.nodes.lightning[0];
      await dockerService.stopNode(network, node);
      expect(composeMock.stopOne).toHaveBeenCalledWith(
        node.name,
        expect.objectContaining({ cwd: network.path }),
      );
    });

    it('should call compose.stopOne and compose.rm when a node is removed', async () => {
      composeMock.stopOne.mockResolvedValue(mockResult);
      composeMock.rm.mockResolvedValue(mockResult);
      const node = network.nodes.lightning[0];
      await dockerService.removeNode(network, node);
      expect(composeMock.stopOne).toHaveBeenCalledWith(
        node.name,
        expect.objectContaining({ cwd: network.path }),
      );
      expect(composeMock.rm).toHaveBeenCalledWith(
        expect.objectContaining({ cwd: network.path }),
        node.name,
      );
    });

    it('should rename a node dir', async () => {
      filesMock.exists.mockResolvedValue(true);
      const node = network.nodes.lightning[0];
      await dockerService.renameNodeDir(network, node, 'new-name');
      expect(filesMock.renameFile).toHaveBeenCalledWith(
        join(network.path, 'volumes', 'lnd', node.name),
        join(network.path, 'volumes', 'lnd', 'new-name'),
      );
      expect(filesMock.rm).toHaveBeenCalledWith(
        join(network.path, 'volumes', 'lnd', node.name, 'tls.cert'),
      );
    });

    it('should not rename a node dir that doesnt exist', async () => {
      filesMock.exists.mockResolvedValue(false);
      const node = network.nodes.lightning[0];
      await dockerService.renameNodeDir(network, node, 'new-name');
      expect(filesMock.exists).toHaveBeenCalled();
      expect(filesMock.renameFile).not.toHaveBeenCalled();
    });

    it('should not delete certs when renaming a non-LND node', async () => {
      filesMock.exists.mockResolvedValue(true);
      const node = network.nodes.lightning[1];
      await dockerService.renameNodeDir(network, node, 'new-name');
      expect(filesMock.renameFile).toHaveBeenCalledWith(
        join(network.path, 'volumes', 'c-lightning', node.name),
        join(network.path, 'volumes', 'c-lightning', 'new-name'),
      );
      expect(filesMock.rm).not.toHaveBeenCalled();
    });

    it('should reformat thrown exceptions', async () => {
      const err = 'oops, didnt work';
      composeMock.upAll.mockRejectedValueOnce({ err });
      await expect(dockerService.start(network)).rejects.toThrow(err);
    });

    it('should pass through thrown exceptions', async () => {
      composeMock.upAll.mockRejectedValueOnce({ errno: 'oops, didnt work' });
      await expect(dockerService.start(network)).rejects.toThrow('oops, didnt work');
    });

    it('should not fail if electron.remote is undefined', async () => {
      Object.defineProperty(electronMock.remote, 'process', { get: () => undefined });
      composeMock.upAll.mockResolvedValue(mockResult);
      await dockerService.start(network);
      expect(composeMock.upAll).toHaveBeenCalledWith(
        expect.objectContaining({ cwd: network.path }),
        undefined,
      );
      Object.defineProperty(electronMock.remote, 'process', { get: () => ({ env: {} }) });
    });
  });

  describe('getDocker', () => {
    it('should detect DOCKER_HOST', async () => {
      Object.defineProperty(electronMock.remote, 'process', {
        get: () => ({ env: { DOCKER_HOST: '/var/run/docker.sock' } }),
      });
      await getDocker(false);
      expect(mockDockerode.prototype.constructor).toHaveBeenCalledWith();
      Object.defineProperty(electronMock.remote, 'process', { get: () => ({ env: {} }) });
    });

    it('should check paths on Mac', async () => {
      mockOS.platform.mockReturnValue('darwin');
      Object.defineProperty(electronMock.remote, 'process', {
        get: () => ({ env: { HOME: '/home/user' } }),
      });
      filesMock.exists.mockImplementation((path: string) => {
        return Promise.resolve(path === '/var/run/docker.sock');
      });
      await getDocker(false);
      expect(filesMock.exists).toHaveBeenCalledWith('/home/user/.docker/run/docker.sock');
      expect(filesMock.exists).toHaveBeenCalledWith('/var/run/docker.sock');
      expect(mockDockerode.prototype.constructor).toHaveBeenCalledWith({
        socketPath: '/var/run/docker.sock',
      });
      Object.defineProperty(electronMock.remote, 'process', { get: () => ({ env: {} }) });
    });

    it('should check paths on Linux', async () => {
      mockOS.platform.mockReturnValue('linux');
      Object.defineProperty(electronMock.remote, 'process', {
        get: () => ({ env: { HOME: '/home/user' } }),
      });
      filesMock.exists.mockImplementation((path: string) => {
        return Promise.resolve(path === '/var/run/docker.sock');
      });
      await getDocker(false);
      expect(filesMock.exists).toHaveBeenCalledWith('/home/user/.docker/run/docker.sock');
      expect(filesMock.exists).toHaveBeenCalledWith('/var/run/docker.sock');
      expect(mockDockerode.prototype.constructor).toHaveBeenCalledWith({
        socketPath: '/var/run/docker.sock',
      });
      Object.defineProperty(electronMock.remote, 'process', { get: () => ({ env: {} }) });
    });

    it('should not check paths on windows', async () => {
      mockOS.platform.mockReturnValue('win32');
      await getDocker(false);
      expect(mockDockerode.prototype.constructor).toHaveBeenCalledWith();
    });

    it('should reuse a cached instance for multiple calls', async () => {
      const docker1 = await getDocker();
      const docker2 = await getDocker();
      expect(docker1).toBe(docker2);
    });
  });

  describe('simulation commands', () => {
    const network = createNetwork({
      id: 1,
      name: 'my network',
      description: 'network description',
      lndNodes: 1,
      clightningNodes: 1,
      eclairNodes: 1,
      bitcoindNodes: 1,
      btcdNodes: 0,
      tapdNodes: 0,
      litdNodes: 1,
      repoState: defaultRepoState,
      managedImages: testManagedImages,
      customImages: [],
      manualMineCount: 6,
    });
    const mockResult = { err: '', out: '', exitCode: 0 };
    const lndNodes = network.nodes.lightning.filter(n => n.implementation === 'LND');
    const eclairNodes = network.nodes.lightning.filter(
      n => n.implementation === 'eclair',
    );
    const clightningNodes = network.nodes.lightning.filter(
      n => n.implementation === 'c-lightning',
    );
    const litdNodes = network.nodes.lightning.filter(n => n.implementation === 'litd');
    beforeEach(() => {
      // Add simulation config to the test network
      network.simulation = {
        activity: [
          {
            id: 0,
            source: lndNodes[0].name,
            destination: eclairNodes[0].name,
            intervalSecs: 60,
            amountMsat: 1000,
          },
        ],
        status: Status.Stopped,
      };
    });

    it('should start a simulation', async () => {
      composeMock.upOne.mockResolvedValue(mockResult);
      await dockerService.startSimulation(network);

      // Verify directories were created
      expect(fsMock.ensureDir).toHaveBeenCalled();

      // Verify sim.json was written with correct config
      expect(filesMock.write).toHaveBeenCalledWith(
        expect.stringContaining('sim.json'),
        expect.stringContaining(lndNodes[0].name),
      );

      // Verify docker compose command was called
      expect(composeMock.upOne).toHaveBeenCalledWith(
        'simln',
        expect.objectContaining({ cwd: network.path }),
      );
    });

    it('should stop a simulation', async () => {
      composeMock.stopOne.mockResolvedValue(mockResult);
      await dockerService.stopSimulation(network);

      expect(composeMock.stopOne).toHaveBeenCalledWith(
        'simln',
        expect.objectContaining({ cwd: network.path }),
      );
    });

    it('should remove a simulation', async () => {
      composeMock.stopOne.mockResolvedValue(mockResult);
      composeMock.rm.mockResolvedValue(mockResult);
      await dockerService.removeSimulation(network);

      // Verify stop was called first
      expect(composeMock.stopOne).toHaveBeenCalledWith(
        'simln',
        expect.objectContaining({ cwd: network.path }),
      );

      // Verify remove was called after
      expect(composeMock.rm).toHaveBeenCalledWith(
        expect.objectContaining({ cwd: network.path }),
        'simln',
      );
    });

    it('should handle errors when node is not found', async () => {
      network.simulation!.activity[0].source = 'non-existent';
      await expect(dockerService.startSimulation(network)).rejects.toThrow(
        'Node non-existent not found in network',
      );
    });

    it('should return empty arrays when network has no simulation config', async () => {
      // Create network without simulation config
      const networkWithoutSim = getNetwork();
      networkWithoutSim.simulation = undefined;

      // Call constructSimJson directly to test the early return
      const simJson = dockerService.constructSimJson(networkWithoutSim);
      expect(simJson).toEqual({ nodes: [], activity: [] });
    });

    it('should add simln to the docker-compose.yml file', async () => {
      network.simulation = {} as any;
      dockerService.saveComposeFile(network);
      expect(filesMock.write).toHaveBeenCalledWith(
        expect.stringContaining('docker-compose.yml'),
        expect.stringContaining(`container_name: polar-n1-simln`),
      );
    });

    // Now we should be able to use c-lightning and litd in the simulation
    it('should add c-lightning to the docker-compose.yml file', async () => {
      network.simulation = {
        activity: [
          {
            id: 0,
            source: clightningNodes[0].name,
            destination: litdNodes[0].name,
            intervalSecs: 60,
            amountMsat: 1000,
          },
        ],
        status: Status.Stopped,
      };
      dockerService.saveComposeFile(network);
      expect(filesMock.write).toHaveBeenCalledWith(
        expect.stringContaining('docker-compose.yml'),
        expect.stringContaining(`container_name: polar-n1-simln`),
      );

      composeMock.upOne.mockResolvedValue(mockResult);
      await dockerService.startSimulation(network);

      // Verify directories were created
      expect(fsMock.ensureDir).toHaveBeenCalled();

      // Verify sim.json was written with correct config
      expect(filesMock.write).toHaveBeenCalledWith(
        expect.stringContaining('sim.json'),
        expect.stringContaining(clightningNodes[0].name),
      );

      // Verify docker compose command was called
      expect(composeMock.upOne).toHaveBeenCalledWith(
        'simln',
        expect.objectContaining({ cwd: network.path }),
      );
    });

    it('should map windows paths to posix paths', () => {
      // Mock Windows-style absolute paths.
      const lnd = lndNodes[0] as LndNode;
      const windowsPath = `C:\\Users\\username\\.polar\\networks\\${network.id}\\volumes\\lnd\\${lnd.name}`;

      const tlsCertPath = `${windowsPath}\\tls.cert`;
      const macaroonPath = `${windowsPath}\\data\\chain\\bitcoin\\regtest\\admin.macaroon`;

      lnd.paths.tlsCert = tlsCertPath;
      lnd.paths.adminMacaroon = macaroonPath;

      network.simulation = {
        activity: [
          {
            id: 0,
            source: lndNodes[0].name,
            destination: eclairNodes[0].name,
            intervalSecs: 60,
            amountMsat: 1000,
          },
        ],
        status: Status.Stopped,
      };

      const simJson = dockerService.constructSimJson(network);

      const lndNode = simJson.nodes.find(n => n.id === lnd.name);
      expect(lndNode).toBeDefined();
      expect(lndNode?.cert).toBe(`/home/simln/.lnd/${lnd.name}/tls.cert`);
      expect(lndNode?.macaroon).toBe(
        `/home/simln/.lnd/${lnd.name}/data/chain/bitcoin/regtest/admin.macaroon`,
      );
    });

    it('should handle missing c-lightning paths', () => {
      const net = getNetwork();
      const cln = net.nodes.lightning.filter(
        n => n.implementation === 'c-lightning',
      )[0] as CLightningNode;
      cln.paths.tlsCert = undefined;
      cln.paths.tlsClientCert = undefined;
      cln.paths.tlsClientKey = undefined;
      net.simulation = {
        activity: [
          {
            id: 0,
            source: cln.name,
            destination: net.nodes.lightning[0].name,
            intervalSecs: 60,
            amountMsat: 1000,
          },
        ],
        status: Status.Stopped,
      };
      const simJson = dockerService.constructSimJson(net);
      const clnSimNode = simJson.nodes.find(n => n.id === cln.name);
      expect(clnSimNode?.ca_cert).toBeDefined();
      expect(clnSimNode?.client_cert).toBeDefined();
      expect(clnSimNode?.client_key).toBeDefined();
    });
  });
});
