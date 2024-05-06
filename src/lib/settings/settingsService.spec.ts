import { AppSettings } from 'types';
import * as files from 'utils/files';
import { settingsService } from './';

jest.mock('utils/files', () => ({
  write: jest.fn(),
  read: jest.fn(),
  exists: jest.fn(),
}));

const filesMock = files as jest.Mocked<typeof files>;

describe('SettingsService', () => {
  let settings: AppSettings;

  beforeEach(() => {
    settings = {
      lang: 'en-US',
      checkForUpdatesOnStartup: false,
      theme: 'dark',
      nodeImages: { custom: [], managed: [] },
      newNodeCounts: {
        LND: 1,
        'c-lightning': 1,
        eclair: 1,
        bitcoind: 1,
        btcd: 0,
        tapd: 0,
        litd: 0,
      },
      basePorts: {
        LND: {
          rest: 8080,
          grpc: 10001,
        },
        bitcoind: {
          rest: 18443,
        },
        'c-lightning': {
          rest: 8181,
          grpc: 11001,
        },
        eclair: {
          rest: 8281,
        },
        tapd: {
          rest: 8289,
          grpc: 12029,
        },
      },
    };
  });

  it('should save the settings to disk', () => {
    settingsService.save(settings);
    expect(filesMock.write).toBeCalledWith(
      expect.stringContaining('settings.json'),
      expect.stringContaining(`"lang": "en-US"`),
    );
  });

  it('should load the settings from disk', async () => {
    filesMock.exists.mockResolvedValue(true);
    filesMock.read.mockResolvedValue('{ "lang": "en-US" }');
    const settings = await settingsService.load();
    expect(settings).toBeDefined();
    expect(settings && settings.lang).toBe('en-US');
    expect(filesMock.read).toBeCalledWith(expect.stringContaining('settings.json'));
  });

  it('should return undefined if no settings are saved', async () => {
    filesMock.exists.mockResolvedValue(false);
    const settings = await settingsService.load();
    expect(settings).toBeUndefined();
  });
});
