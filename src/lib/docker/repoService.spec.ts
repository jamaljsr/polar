import * as utils from 'shared/utils';
import { repoService } from 'lib/docker';
import { DockerRepoState } from 'types';
import { defaultRepoState } from 'utils/constants';
import * as files from 'utils/files';
import { clone } from 'utils/tests';

jest.mock('utils/files', () => ({
  write: jest.fn(),
  read: jest.fn(),
  exists: jest.fn(),
}));
jest.mock('shared/utils');

const filesMock = files as jest.Mocked<typeof files>;
const utilsMock = utils as jest.Mocked<typeof utils>;

describe('RepoService', () => {
  it('should save state to disk', async () => {
    await repoService.save(defaultRepoState);
    expect(filesMock.write).toBeCalledWith(
      expect.stringContaining('nodes.json'),
      expect.stringContaining(`"version": ${defaultRepoState.version}`),
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

  it('should not load state from disk if the file is empty', async () => {
    filesMock.exists.mockResolvedValue(true);
    filesMock.read.mockResolvedValue('');
    const result = await repoService.load();
    expect(result).not.toBeDefined();
  });

  describe('checkForUpdates', () => {
    const localState = defaultRepoState;
    const updatedState: DockerRepoState = {
      ...defaultRepoState,
      version: defaultRepoState.version + 1,
      images: {
        ...defaultRepoState.images,
        bitcoind: {
          latest: '1.0.0',
          versions: ['1.0.0', ...defaultRepoState.images.bitcoind.versions],
        },
      },
    };

    it('should return no updates for the same version', async () => {
      utilsMock.httpRequest.mockResolvedValue(JSON.stringify(clone(localState)));
      const result = await repoService.checkForUpdates(localState);
      expect(result.state).toEqual(localState);
      expect(result.updates).not.toBeDefined();
    });

    it('should return no updates for new version with no new images', async () => {
      utilsMock.httpRequest.mockResolvedValue(
        JSON.stringify({
          ...clone(localState),
          version: localState.version + 1,
        }),
      );
      const result = await repoService.checkForUpdates(localState);
      expect(result.state).toEqual(localState);
      expect(result.updates).not.toBeDefined();
    });

    it('should return updated state with new versions', async () => {
      utilsMock.httpRequest.mockResolvedValue(JSON.stringify(clone(updatedState)));
      const result = await repoService.checkForUpdates(localState);
      expect(result.state).toEqual(updatedState);
      expect(result.updates).toBeDefined();
      expect(result.updates?.bitcoind).toEqual(['1.0.0']);
    });

    it('should ignore a new implementation in the remote state', async () => {
      const newImplState: any = {
        ...defaultRepoState,
        version: defaultRepoState.version + 1,
        images: {
          ...defaultRepoState.images,
          newImpl: {
            latest: '1.0.0',
            versions: ['1.0.0'],
          },
        },
      };

      utilsMock.httpRequest.mockResolvedValue(JSON.stringify(clone(newImplState)));
      const result: any = await repoService.checkForUpdates(localState);
      expect(result.state).toEqual(localState);
      expect(result.updates).not.toBeDefined();
      expect(result.updates?.newImpl).not.toBeDefined();
    });

    it('should handle a removed implementation in the remote state', async () => {
      const remoteState = {
        ...clone(localState),
        version: localState.version + 1,
        images: {
          ...localState.images,
          eclair: undefined,
        },
      };
      utilsMock.httpRequest.mockResolvedValue(JSON.stringify(remoteState));
      const result: any = await repoService.checkForUpdates(localState);
      expect(result.state).toEqual(localState);
    });
  });
});
