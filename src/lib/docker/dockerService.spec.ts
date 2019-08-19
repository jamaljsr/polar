import * as compose from 'docker-compose';
import dockerService from './dockerService';
import { getNetwork } from 'utils/tests';

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
    expect(composeMock.upAll).toBeCalledWith({ cwd: 'ELECTRON_PATH[userData]\\data\\0' });
  });
});
