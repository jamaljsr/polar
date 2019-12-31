import fetchMock from 'fetch-mock';
import { repoService } from 'lib/docker';
import { DockerRepoState } from 'types';
import { defaultRepoState } from 'utils/constants';
import * as files from 'utils/files';

jest.mock('utils/files', () => ({
  write: jest.fn(),
  read: jest.fn(),
  exists: jest.fn(),
}));

const filesMock = files as jest.Mocked<typeof files>;

describe('RepoService', () => {
  it('should save state to disk', async () => {
    await repoService.save(defaultRepoState);
    expect(filesMock.write).toBeCalledWith(
      expect.stringContaining('nodes.json'),
      expect.stringContaining('"version": 2'),
    );
  });

  it('should load the state from disk', async () => {
    filesMock.exists.mockResolvedValue(true);
    filesMock.read.mockResolvedValue(JSON.stringify(defaultRepoState));
    const result = await repoService.load();
    expect(result).toEqual(defaultRepoState);
  });

  it('should not load state from disk if file does not exist', async () => {
    filesMock.exists.mockResolvedValue(false);
    const result = await repoService.load();
    expect(result).not.toBeDefined();
  });

  describe('checkForUpdates', () => {
    const localState = defaultRepoState;
    const updatedState: DockerRepoState = {
      ...defaultRepoState,
      version: 3,
      images: {
        ...defaultRepoState.images,
        bitcoind: {
          latest: '1.0.0',
          versions: ['1.0.0', ...defaultRepoState.images.bitcoind.versions],
        },
      },
    };

    beforeEach(fetchMock.reset);

    it('should return no updates for the same version', async () => {
      fetchMock.once('end:/nodes.json', localState);
      const result = await repoService.checkForUpdates(localState);
      expect(result.state).toEqual(localState);
      expect(result.updates).not.toBeDefined();
    });

    it('should return no updates for new version with no new images', async () => {
      fetchMock.once('end:/nodes.json', {
        ...localState,
        version: localState.version + 1,
      });
      const result = await repoService.checkForUpdates(localState);
      expect(result.state).toEqual(localState);
      expect(result.updates).not.toBeDefined();
    });

    it('should return updated state with new versions', async () => {
      fetchMock.once('end:/nodes.json', updatedState);
      const result = await repoService.checkForUpdates(localState);
      expect(result.state).toEqual(updatedState);
      expect(result.updates).toBeDefined();
      expect(result.updates?.bitcoind).toEqual(['1.0.0']);
    });
  });
});
