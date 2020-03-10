import fsExtra from 'fs-extra';
import { join } from 'path';
import * as archiver from 'archiver';
import { PassThrough } from 'stream';
import unzipper from 'unzipper';
import * as files from 'utils/files';
import { delay } from './async';
import { initChartFromNetwork } from './chart';
import { getNetwork } from './tests';
import { unzip, zip } from './zip';

jest.mock('utils/files');

const fsMock = fsExtra as jest.Mocked<typeof fsExtra>;
const filesMock = files as jest.Mocked<typeof files>;
const unzipperMock = unzipper as jest.Mocked<typeof unzipper>;
const archiverMock = archiver as jest.Mocked<any>;

describe('Zip Util', () => {
  let unzipStream: PassThrough;
  let zipStream: any;
  let zippedPaths: string[];
  const rpcPath = join('alice', 'lightningd', 'regtest', 'lightning-rpc');

  beforeEach(() => {
    const network = getNetwork();
    const chart = initChartFromNetwork(network);
    filesMock.read.mockResolvedValue(JSON.stringify({ network, chart }));
    fsMock.pathExists.mockResolvedValue(true as never);
    fsMock.mkdirp.mockResolvedValue(true as never);
    fsMock.copy.mockResolvedValue(true as never);
    fsMock.createWriteStream.mockReturnValue(new PassThrough() as any);
    fsMock.createReadStream.mockImplementation(() => {
      return {
        pipe: jest.fn(() => {
          // return the mock stream when "pipe()" is called
          unzipStream = new PassThrough();
          return unzipStream;
        }),
      } as any;
    });
    unzipperMock.Extract.mockImplementation(jest.fn());
    archiverMock.mockImplementation(() => {
      // return a fake stream when "archiver()" is called in the app
      zipStream = new PassThrough();
      zipStream.file = jest.fn();
      zipStream.directory = jest.fn(
        (src: string, dest: string, entryData: archiver.EntryDataFunction) => {
          // call the entryData func on some test paths
          const mockPaths = ['test.yml', 'other.json', rpcPath];
          zippedPaths = [];
          mockPaths.forEach(name => {
            const result = entryData({ name });
            if (result) zippedPaths.push(name);
          });
        },
      );
      zipStream.append = jest.fn();
      zipStream.finalize = jest.fn();
      // attach a func to emit events on the stream from the tests
      zipStream.mockEmit = (event: any, data: any) => zipStream.emit(event, data);

      return zipStream;
    });
  });

  afterEach(() => {
    if (unzipStream) unzipStream.destroy();
    if (zipStream) zipStream.destroy();
  });

  describe('unzip', () => {
    it('should unzip a file successfully', async () => {
      const promise = unzip('source-path', 'destination-path');
      // emit an error after a small delay
      await delay(100);
      unzipStream.emit('close');
      await expect(promise).resolves.toBeUndefined();
    });

    it("fail to unzip something that isn't a zip", async () => {
      const promise = unzip('source-path', 'destination-file');
      // fail the unzip stream after a small delay
      await delay(100);
      unzipStream.emit('error', new Error('test-error'));
      await expect(promise).rejects.toThrow();
    });

    it("fails to unzip something that doesn't exist", async () => {
      fsMock.pathExists.mockResolvedValue(false as never);
      return expect(unzip('source-path', 'destination-file')).rejects.toThrow();
    });
  });

  describe('zip', () => {
    it('should zip a folder successfully', async () => {
      const promise = zip('source-path', 'destination-path');
      // emit an error after a small delay
      await delay(100);
      zipStream.emit('finish');
      await expect(promise).resolves.toBeUndefined();
    });

    it('should not include the c-lightning RPC in the zip', async () => {
      const promise = zip('source-path', 'destination-path');
      // emit an error after a small delay
      await delay(100);
      zipStream.emit('finish');
      await expect(promise).resolves.toBeUndefined();
      expect(zippedPaths).not.toContain(rpcPath);
      expect(zippedPaths).toEqual(['test.yml', 'other.json']);
    });

    it('should fail if there is an archiver error', async () => {
      const promise = zip('source-path', 'destination-path');
      // emit an error after a small delay
      await delay(100);
      const mockError = new Error('test-error');
      zipStream.emit('error', mockError);
      await expect(promise).rejects.toEqual(mockError);
    });

    it('should fail if there is an archiver warning', async () => {
      const promise = zip('source-path', 'destination-path');
      // emit a warning after a small delay
      const mockError = new Error('test-warning');
      zipStream.emit('warning', mockError);
      await expect(promise).rejects.toEqual(mockError);
    });
  });
});
