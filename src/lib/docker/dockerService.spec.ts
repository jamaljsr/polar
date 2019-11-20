import * as electron from 'electron';
import * as fs from 'fs-extra';
import { join } from 'path';
import * as compose from 'docker-compose';
import Dockerode from 'dockerode';
import os from 'os';
import { dockerService } from 'lib/docker';
import { Network } from 'types';
import { DOCKER_REPO } from 'utils/constants';
import * as files from 'utils/files';
import { createNetwork } from 'utils/network';
import { getNetwork } from 'utils/tests';

jest.mock('dockerode');
jest.mock('os');
jest.mock('utils/files', () => ({
  write: jest.fn(),
  read: jest.fn(),
  exists: jest.fn(),
}));

const mockOS = os as jest.Mocked<typeof os>;
const filesMock = files as jest.Mocked<typeof files>;
const composeMock = compose as jest.Mocked<typeof compose>;
const electronMock = electron as jest.Mocked<typeof electron>;
const mockDockerode = (Dockerode as unknown) as jest.Mock<Dockerode>;

describe('DockerService', () => {
  let network: Network;
  // default response of docker calls for mocks
  const mockResult = { err: '', out: '', exitCode: 0 };

  beforeEach(() => {
    network = getNetwork();
  });

  it('should populate env vars with compose commands', async () => {
    electronMock.remote.process.env = { __TESTVAR: 'TESTVAL' };
    await dockerService.getVersions();
    expect(composeMock.version).toBeCalledWith(
      expect.objectContaining({
        env: expect.objectContaining({ __TESTVAR: 'TESTVAL' }),
      }),
      undefined,
    );
  });

  it('should populate UID/GID env vars when runing on linux', async () => {
    mockOS.platform.mockReturnValue('linux');
    mockOS.userInfo.mockReturnValue({ uid: 999, gid: 999 } as any);
    await dockerService.getVersions();
    expect(composeMock.version).toBeCalledWith(
      expect.objectContaining({
        env: expect.objectContaining({ USERID: 999, GROUPID: 999 }),
      }),
      undefined,
    );
  });

  describe('detecting versions', () => {
    const dockerVersion = mockDockerode.prototype.version;
    const composeVersion = composeMock.version;

    it('should get both versions successfully', async () => {
      dockerVersion.mockResolvedValue({ Version: '1.2.3' });
      composeVersion.mockResolvedValue({ ...mockResult, out: '4.5.6' });
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
      composeVersion.mockResolvedValue({ ...mockResult, out: '4.5.6' });
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
      composeVersion.mockResolvedValue({ ...mockResult, out: '4.5.6' });
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

    it('should return a list of prefixed images', async () => {
      dockerListImages.mockResolvedValue(mapResponse([polar('aaa'), polar('bbb')]));
      expect(await dockerService.getImages()).toEqual(['aaa', 'bbb']);
    });

    it('should not return images that do not start with the prefix', async () => {
      dockerListImages.mockResolvedValue(mapResponse(['other1', polar('aaa'), 'other2']));
      expect(await dockerService.getImages()).toEqual(['aaa']);
    });

    it('should return an empty list if the fetch fails', async () => {
      dockerListImages.mockRejectedValue(new Error('test-error'));
      expect(await dockerService.getImages()).toEqual([]);
    });
  });

  describe('saving data', () => {
    it('should save the docker-compose.yml file', () => {
      dockerService.saveComposeFile(network);

      expect(filesMock.write).toBeCalledWith(
        expect.stringContaining('docker-compose.yml'),
        expect.stringContaining('version:'),
      );

      expect(filesMock.write).toBeCalledWith(
        expect.stringContaining('docker-compose.yml'),
        expect.stringContaining('services:'),
      );
    });

    it('should save with the bitcoin node in the compose file', () => {
      dockerService.saveComposeFile(network);
      expect(filesMock.write).toBeCalledWith(
        expect.stringContaining('docker-compose.yml'),
        expect.stringContaining(
          `container_name: polar-n1-${network.nodes.bitcoin[0].name}`,
        ),
      );
    });

    it('should save with the lnd node in the compose file', () => {
      dockerService.saveComposeFile(network);
      expect(filesMock.write).toBeCalledWith(
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
        lndNodes: 1,
        clightningNodes: 0,
        bitcoindNodes: 1,
      });
      net.nodes.lightning[0].backendName = 'invalid';
      dockerService.saveComposeFile(net);
      expect(filesMock.write).toBeCalledWith(
        expect.stringContaining('docker-compose.yml'),
        expect.stringContaining(
          `container_name: polar-n1-${network.nodes.lightning[0].name}`,
        ),
      );
    });

    it('should not save unknown lightning implementation', () => {
      network.nodes.lightning[0].implementation = 'eclair';
      dockerService.saveComposeFile(network);
      expect(filesMock.write).toBeCalledWith(
        expect.stringContaining('docker-compose.yml'),
        expect.not.stringContaining(
          `container_name: polar-n1-${network.nodes.lightning[0].name}`,
        ),
      );
    });

    it('should save a list of networks to disk', () => {
      dockerService.saveNetworks({ networks: [network], charts: {} });
      expect(filesMock.write).toBeCalledWith(
        expect.stringContaining(join('networks', 'networks.json')),
        expect.stringContaining(`"name": "${network.name}"`),
      );
    });
  });

  describe('loading data', () => {
    it('should load the list of networks from disk', async () => {
      filesMock.exists.mockResolvedValue(true);
      filesMock.read.mockResolvedValue('{ "networks": [], "charts": {} }');
      const { networks } = await dockerService.loadNetworks();
      expect(networks.length).toBe(0);
      expect(filesMock.read).toBeCalledWith(
        expect.stringContaining(join('networks', 'networks.json')),
      );
    });

    it('should return an empty list if no networks are saved', async () => {
      filesMock.exists.mockResolvedValue(false);
      const { networks } = await dockerService.loadNetworks();
      expect(Array.isArray(networks)).toBe(true);
      expect(networks.length).toBe(0);
    });
  });

  describe('executing commands', () => {
    it('should call compose.upAll when a network is started', async () => {
      composeMock.upAll.mockResolvedValue(mockResult);
      await dockerService.start(network);
      expect(composeMock.upAll).toBeCalledWith(
        expect.objectContaining({ cwd: network.path }),
        undefined,
      );
    });

    it('should create volume dirs when the network is started', async () => {
      composeMock.upAll.mockResolvedValue(mockResult);
      await dockerService.start(network);
      expect(fs.ensureDir).toBeCalledTimes(3);
    });

    it('should not create volume dirs for unknown implementations', async () => {
      network.nodes.lightning[0].implementation = 'c-lightning';
      composeMock.upAll.mockResolvedValue(mockResult);
      await dockerService.start(network);
      expect(fs.ensureDir).toBeCalledTimes(2);
    });

    it('should call compose.down when a network is stopped', async () => {
      composeMock.down.mockResolvedValue(mockResult);
      await dockerService.stop(network);
      expect(composeMock.down).toBeCalledWith(
        expect.objectContaining({ cwd: network.path }),
        undefined,
      );
    });

    it('should call compose.stopOne and compose.rm when a node is removed', async () => {
      composeMock.stopOne.mockResolvedValue(mockResult);
      composeMock.rm.mockResolvedValue(mockResult);
      const node = network.nodes.lightning[0];
      await dockerService.removeNode(network, node);
      expect(composeMock.stopOne).toBeCalledWith(
        node.name,
        expect.objectContaining({ cwd: network.path }),
      );
      expect(composeMock.rm).toBeCalledWith(
        expect.objectContaining({ cwd: network.path }),
        undefined,
      );
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
      electronMock.remote.process = undefined;
      composeMock.upAll.mockResolvedValue(mockResult);
      await dockerService.start(network);
      expect(composeMock.upAll).toBeCalledWith(
        expect.objectContaining({ cwd: network.path }),
        undefined,
      );
      electronMock.remote.process = {};
    });
  });
});
