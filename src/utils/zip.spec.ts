import fsExtra from 'fs-extra';
import { join } from 'path';
import archiver from 'archiver';
import { PassThrough } from 'stream';
import { unzip, zip } from './zip';

const fsMock = fsExtra as jest.Mocked<typeof fsExtra>;
const archiverMock = archiver as jest.Mocked<any>;

describe('unzip', () => {
  it("fail to unzip something that isn't a zip", async () => {
    return expect(
      unzip(join(__dirname, 'tests', 'resources', 'bar.txt'), 'foobar'),
    ).rejects.toThrow();
  });

  it("fails to unzip something that doesn't exist", async () => {
    return expect(unzip('foobar', 'bazfoo')).rejects.toThrow();
  });
});

describe('zip', () => {
  // it('zips objects', async () => {
  //   const objects: Array<{ name: string; object: any }> = [
  //     {
  //       name: 'firstObject',
  //       object: 2,
  //     },
  //     {
  //       name: 'secondObject',
  //       object: { baz: 'baz' },
  //     },
  //     {
  //       name: 'thirdObject',
  //       object: [2, { foo: 'foo' }, false],
  //     },
  //   ];

  //   const zipped = join(tmpdir(), `zip-test-${Date.now()}.zip`);
  //   await zip({
  //     destination: zipped,
  //     objects,
  //     paths: [],
  //   });

  //   const unzipped = join(tmpdir(), `zip-test-${Date.now()}`);
  //   await unzip(zipped, unzipped);

  //   for (const obj of objects) {
  //     const read = await fsExtra
  //       .readFile(join(unzipped, obj.name))
  //       .then(read => JSON.parse(read.toString('utf-8')));
  //     expect(read).toEqual(obj.object);
  //   }
  // });

  // it('zips paths', async () => {
  //   const files = [
  //     join(__dirname, 'tests', 'resources', 'bar.txt'),
  //     join(__dirname, 'tests', 'resources', 'foo.json'),
  //     join(__dirname, 'tests', 'resources', 'baz'),
  //   ];
  //   const zipped = join(tmpdir(), `zip-test-${Date.now()}.zip`);
  //   await zip({ destination: zipped, objects: [], paths: files });

  //   const unzipped = join(tmpdir(), `zip-test-${Date.now()}`);
  //   await unzip(zipped, unzipped);

  //   const entries = await fs..readdir(unzipped, { withFileTypes: true });

  //   const bar = entries.find(e => e.name === 'bar.txt');
  //   const baz = entries.find(e => e.name === 'baz');
  //   const foo = entries.find(e => e.name === 'foo.json');

  //   expect(bar?.isFile()).toBeTruthy();
  //   expect(baz?.isDirectory()).toBeTruthy();
  //   expect(foo?.isFile()).toBeTruthy();
  // });

  it('should fail if there is an archiver error', async () => {
    fsMock.createWriteStream.mockReturnValueOnce(new PassThrough() as any);

    const promise = zip('source', 'destination');

    // emit an error after a small delay
    const mockError = new Error('test-error');
    setTimeout(() => {
      archiverMock.mockEmit('error', mockError);
    }, 100);

    await expect(promise).rejects.toEqual(mockError);
  });

  it('should fail if there is an archiver warning', async () => {
    fsMock.createWriteStream.mockReturnValueOnce(new PassThrough() as any);

    const promise = zip('source', 'destination');

    // emit an error after a small delay
    const mockError = new Error('test-warning');
    setTimeout(() => {
      archiverMock.mockEmit('warning', mockError);
    }, 100);

    await expect(promise).rejects.toEqual(mockError);
  });
});
