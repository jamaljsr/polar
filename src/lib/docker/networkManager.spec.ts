import * as files from 'utils/files';
import networkManager from './networkManager';
import { getNetwork } from 'utils/tests';

jest.mock('utils/files', () => ({
  writeDataFile: jest.fn(),
}));

const filesMock = files as jest.Mocked<typeof files>;

describe('NetworkManager', () => {
  let network: Network;

  beforeEach(() => {
    network = getNetwork();
  });

  it('should save the docker-compose.yml file', () => {
    networkManager.create(network);

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
    networkManager.create(network);
    expect(filesMock.writeDataFile).toBeCalledWith(
      expect.stringContaining('docker-compose.yml'),
      expect.stringContaining(`container_name: ${network.nodes.bitcoin[0].name}`),
    );
  });

  it('should save with the lnd node in the compose file', () => {
    networkManager.create(network);
    expect(filesMock.writeDataFile).toBeCalledWith(
      expect.stringContaining('docker-compose.yml'),
      expect.stringContaining(`container_name: ${network.nodes.lightning[0].name}`),
    );
  });
});
