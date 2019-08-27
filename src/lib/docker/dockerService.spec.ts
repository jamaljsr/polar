import * as compose from 'docker-compose';
import { getNetwork } from 'utils/tests';
import { dataPath } from 'utils/config';
import { join } from 'path';
import { Network } from 'types';
import { dockerService } from 'lib/docker';

jest.mock('docker-compose', () => ({
  upAll: jest.fn(() => ({})),
  stop: jest.fn(() => ({})),
}));

const composeMock = compose as jest.Mocked<typeof compose>;

describe('DockerService', () => {
  let network: Network;

  beforeEach(() => {
    network = getNetwork();
  });

  it('should call compose.upAll', () => {
    dockerService.start(network);
    const networkPath = join(dataPath, 'networks', network.id.toString());
    expect(composeMock.upAll).toBeCalledWith({ cwd: networkPath });
  });

  it('should call compose.stop', () => {
    dockerService.stop(network);
    const networkPath = join(dataPath, 'networks', network.id.toString());
    expect(composeMock.stop).toBeCalledWith({ cwd: networkPath });
  });
});
