import * as compose from 'docker-compose';
import { getNetwork } from 'utils/tests';
import { Network } from 'types';
import { dockerService } from 'lib/docker';

const composeMock = compose as jest.Mocked<typeof compose>;

describe('DockerService', () => {
  let network: Network;
  // default response of docker calls for mocks
  const result = { err: '', out: '', exitCode: 0 };

  beforeEach(() => {
    network = getNetwork();
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
