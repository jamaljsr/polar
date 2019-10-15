import { join } from 'path';
import * as compose from 'docker-compose';
import { dockerService } from 'lib/docker';
import { Network } from 'types';
import * as files from 'utils/files';
import { getNetwork } from 'utils/tests';

jest.mock('utils/files', () => ({
  write: jest.fn(),
  read: jest.fn(),
  exists: jest.fn(),
}));

const filesMock = files as jest.Mocked<typeof files>;
const composeMock = compose as jest.Mocked<typeof compose>;

describe('DockerService', () => {
  let network: Network;
  // default response of docker calls for mocks
  const mockResult = { err: '', out: '', exitCode: 0 };

  beforeEach(() => {
    network = getNetwork();
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

    it('should not save unknown lightning implementation', () => {
      network.nodes.lightning[0].implementation = 'c-lightning';
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
      expect(composeMock.upAll).toBeCalledWith({ cwd: network.path });
    });

    it('should call compose.down when a network is stopped', async () => {
      composeMock.down.mockResolvedValue(mockResult);
      await dockerService.stop(network);
      expect(composeMock.down).toBeCalledWith({ cwd: network.path });
    });

    it('should reformat thrown exceptions', async () => {
      const err = 'oops, didnt work';
      composeMock.upAll.mockRejectedValueOnce({ err });
      await expect(dockerService.start(network)).rejects.toThrow(err);
    });
  });
});
