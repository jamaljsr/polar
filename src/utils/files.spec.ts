import fs from 'fs-extra';
import { join } from 'path';
import { dataPath } from './config';
import { abs, exists, read, renameFile, waitForFile, write } from './files';
import { debug, info } from 'electron-log';

jest.mock('fs-extra', () => ({
  mkdirs: jest.fn(),
  outputFile: jest.fn(),
  readFile: jest.fn(() => 'test data'),
  pathExists: jest.fn(),
  rename: jest.fn(),
}));

jest.mock('electron-log', () => ({
  info: jest.fn(),
  debug: jest.fn(),
}));

const mockFs = fs as jest.Mocked<typeof fs>;

const mockInfo = info as jest.MockedFunction<typeof info>;
const mockDebug = debug as jest.MockedFunction<typeof debug>;

describe('Files util', () => {
  describe('read files', () => {
    beforeEach(() => {
      mockFs.readFile.mockResolvedValue(Buffer.from('test data'));
    });

    it('should read files from disk in the app data dir', async () => {
      await read('networks/test.txt');
      expect(mockFs.readFile).toBeCalledTimes(1);
    });

    it('should handle relative paths', async () => {
      const relPath = join('networks', 'test.txt');
      const absPath = join(dataPath, relPath);
      await read(relPath);
      expect(mockFs.readFile).toBeCalledTimes(1);
      expect(mockFs.readFile).toBeCalledWith(absPath);
    });

    it('should handle absolute paths', async () => {
      const absPath = join(__dirname, 'networks', 'test.txt');
      await read(absPath);
      expect(mockFs.readFile).toBeCalledTimes(1);
      expect(mockFs.readFile).toBeCalledWith(absPath);
    });

    it('should convert data from disk to hex format', async () => {
      mockFs.readFile.mockResolvedValue(Buffer.from('test data'));
      const path = join('networks', 'test.txt');
      expect(await read(path, 'hex')).toEqual('746573742064617461');
    });

    it('should convert data from disk to base64 format', async () => {
      mockFs.readFile.mockResolvedValue(Buffer.from('test data'));
      const path = join('networks', 'test.txt');
      expect(await read(path, 'base64')).toEqual('dGVzdCBkYXRh');
    });
  });

  describe('write files', () => {
    it('should write files to disk in the app data dir', async () => {
      await write('networks/test.txt', 'test data');
      expect(mockFs.outputFile).toBeCalledTimes(1);
    });

    it('should handle relative paths', async () => {
      const relPath = join('networks', 'test.txt');
      const absPath = join(dataPath, relPath);
      const data = 'test data';
      await write(relPath, data);
      expect(mockFs.outputFile).toBeCalledTimes(1);
      expect(mockFs.outputFile).toBeCalledWith(absPath, data);
    });

    it('should handle absolute paths', async () => {
      const absPath = join(__dirname, 'networks', 'test.txt');
      const data = 'test data';
      await write(absPath, data);
      expect(mockFs.outputFile).toBeCalledTimes(1);
      expect(mockFs.outputFile).toBeCalledWith(absPath, data);
    });
  });

  describe('file exists', () => {
    it('should return true if the file exists', async () => {
      mockFs.pathExists.mockResolvedValue(true as never);
      const fileExists = await exists(join('networks', 'test.txt'));
      expect(fileExists).toBe(true);
    });

    it('should return false if the file does not exist', async () => {
      mockFs.pathExists.mockResolvedValue(false as never);
      const fileExists = await exists(join('networks', 'test.txt'));
      expect(fileExists).toBe(false);
    });

    it('should handle relative paths', async () => {
      mockFs.pathExists.mockResolvedValue(true as never);
      const relPath = join('networks', 'test.txt');
      const absPath = join(dataPath, relPath);
      const fileExists = await exists(relPath);
      expect(fileExists).toBe(true);
      expect(mockFs.pathExists).toBeCalledWith(absPath);
    });

    it('should handle absolute paths', async () => {
      mockFs.pathExists.mockResolvedValue(true as never);
      const absPath = join(__dirname, 'networks', 'test.txt');
      const fileExists = await exists(absPath);
      expect(fileExists).toBe(true);
      expect(mockFs.pathExists).toBeCalledWith(absPath);
    });
  });

  describe('wait for files', () => {
    it('should resolve immediately if the file already exists', async () => {
      mockFs.pathExists.mockResolvedValue(true as never);
      await expect(waitForFile('test.txt')).resolves.not.toThrow();
    });

    it('should timeout if the file never exists', async () => {
      mockFs.pathExists.mockResolvedValue(false as never);
      await expect(waitForFile('test.txt', 10, 30)).rejects.toThrow();
    });

    it('should resolve once the file exists', async () => {
      // return false initially
      mockFs.pathExists.mockResolvedValue(false as never);
      // chain the spy onto the promise so we can inspect if its been called
      const spy = jest.fn(x => x);
      const promise = waitForFile('test.txt', 10, 100).then(spy);
      // confirm it isn't called immediately
      expect(spy).not.toBeCalled();
      // make pathExists return true
      mockFs.pathExists.mockResolvedValue(true as never);
      // wait for the promise to be resolved
      await expect(promise).resolves.not.toThrow();
      // confirm the spy was called
      expect(spy).toBeCalled();
    });
  });

  describe('renameFile', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should rename a file successfully', async () => {
      const oldPath = 'oldFile.txt';
      const newPath = 'newFile.txt';

      mockFs.rename.mockResolvedValueOnce(undefined);

      await renameFile(oldPath, newPath);

      expect(mockFs.rename).toBeCalledWith(abs(oldPath), abs(newPath));
      expect(mockInfo).toBeCalledWith(
        `File renamed successfully from ${oldPath} to ${newPath}`,
      );
      expect(mockDebug).not.toBeCalled();
    });

    it('should log an error if renaming fails', async () => {
      const oldPath = 'oldFile.txt';
      const newPath = 'newFile.txt';
      const error = new Error('Rename failed');

      mockFs.rename.mockRejectedValueOnce(error);

      await renameFile(oldPath, newPath);

      expect(mockFs.rename).toBeCalledWith(abs(oldPath), abs(newPath));
      expect(mockInfo).not.toBeCalled();
      expect(mockDebug).toBeCalledWith('Error occurred while renaming file:', error);
    });
  });
});
