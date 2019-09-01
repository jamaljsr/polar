import fs from 'fs-extra';
import { join } from 'path';
import { dataPath } from './config';
import { exists, read, write } from './files';

jest.mock('fs-extra', () => ({
  mkdirs: jest.fn(),
  outputFile: jest.fn(),
  readFile: jest.fn(() => 'test data'),
  pathExists: jest.fn(),
}));

const mockFs = fs as jest.Mocked<typeof fs>;

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
});
