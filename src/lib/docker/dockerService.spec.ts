import * as compose from 'docker-compose';
import { dockerService } from 'lib/docker';
import { Network } from 'types';
import * as files from 'utils/files';
import { getNetwork } from 'utils/tests';

jest.mock('utils/files', () => ({
  writeDataFile: jest.fn(),
}));

const filesMock = files as jest.Mocked<typeof files>;
const composeMock = compose as jest.Mocked<typeof compose>;

describe('DockerService', () => {
  let network: Network;
  // default response of docker calls for mocks
  const result = { err: '', out: '', exitCode: 0 };

  beforeEach(() => {
    network = getNetwork();
  });

  it('should save the docker-compose.yml file', () => {
    dockerService.create(network);

    expect(filesMock.writeDataFile).toBeCalledWith(
      expect.stringContaining('docker-compose.yml'),
      expect.stringContaining('version:'),
    );

    expect(filesMock.writeDataFile).toBeCalledWith(
      expect.stringContaining('docker-compose.yml'),
      expect.stringContaining('services:'),
    );
  });

  it('should save with the bitcoin node in the compose file', () => {
    dockerService.create(network);
    expect(filesMock.writeDataFile).toBeCalledWith(
      expect.stringContaining('docker-compose.yml'),
      expect.stringContaining(
        `container_name: polar-n1-${network.nodes.bitcoin[0].name}`,
      ),
    );
  });

  it('should save with the lnd node in the compose file', () => {
    dockerService.create(network);
    expect(filesMock.writeDataFile).toBeCalledWith(
      expect.stringContaining('docker-compose.yml'),
      expect.stringContaining(
        `container_name: polar-n1-${network.nodes.lightning[0].name}`,
      ),
    );
  });

  it('should call compose.upAll', async () => {
    composeMock.upAll.mockResolvedValue(result);
    await dockerService.start(network);
    expect(composeMock.upAll).toBeCalledWith({ cwd: network.path });
  });

  it('should call compose.stop', async () => {
    composeMock.stop.mockResolvedValue(result);
    await dockerService.stop(network);
    expect(composeMock.stop).toBeCalledWith({ cwd: network.path });
  });

  it('should reformat thrown exceptions', async () => {
    const err = 'oops, didnt work';
    composeMock.upAll.mockRejectedValueOnce({ err });
    await expect(dockerService.start(network)).rejects.toEqual(new Error(err));
  });
});
