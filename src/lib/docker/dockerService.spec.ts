import * as compose from 'docker-compose';
import dockerService from './dockerService';
import { getNetwork } from 'utils/tests';
import { dataPath } from 'utils/config';
import { join } from 'path';

jest.mock('docker-compose', () => ({
  upAll: jest.fn(),
}));

const composeMock = compose as jest.Mocked<typeof compose>;

describe('DockerService', () => {
  let network: Network;

  beforeEach(() => {
    network = getNetwork();
  });

  it('should call compose.upAll', () => {
    dockerService.start(network);
    const networkPath = join(dataPath, network.id.toString());
    expect(composeMock.upAll).toBeCalledWith({ cwd: networkPath });
  });
});
