import * as fs from 'fs';
import { writeDataFile } from './files';
import { join } from 'path';
import { dataPath } from './config';

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

  it('should handle relative paths', async () => {
    const relPath = join('networks', 'test.txt');
    const absPath = join(dataPath, relPath);
    const data = 'test data';
    await writeDataFile(relPath, data);
    expect(mockFs.promises.mkdir).toBeCalledTimes(1);
    expect(mockFs.promises.writeFile).toBeCalledTimes(1);
    expect(mockFs.promises.writeFile).toBeCalledWith(absPath, data);
  });

  it('should handle absolute paths', async () => {
    const absPath = join(__dirname, 'networks', 'test.txt');
    const data = 'test data';
    await writeDataFile(absPath, data);
    expect(mockFs.promises.mkdir).toBeCalledTimes(1);
    expect(mockFs.promises.writeFile).toBeCalledTimes(1);
    expect(mockFs.promises.writeFile).toBeCalledWith(absPath, data);
  });
});
