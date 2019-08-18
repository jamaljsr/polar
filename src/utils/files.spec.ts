import * as fs from 'fs';
import { writeDataFile } from './files';

jest.mock('fs', () => ({
  promises: {
    mkdir: jest.fn(),
    writeFile: jest.fn(),
  },
}));

const mockFs = fs as jest.Mocked<typeof fs>;

describe('Files util', () => {
  it('should write files to disk in the app data dir', async () => {
    await writeDataFile('networks/test.txt', 'test data');
    expect(mockFs.promises.mkdir).toBeCalledTimes(1);
    expect(mockFs.promises.writeFile).toBeCalledTimes(1);
  });
});
