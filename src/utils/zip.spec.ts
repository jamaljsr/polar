import { promises as fs } from 'fs';
import { join } from 'path';
import archiver from 'archiver';
import { tmpdir } from 'os';
import { unzip, zip } from './zip';

jest.mock('fs-extra', () => jest.requireActual('fs-extra'));

describe('unzip', () => {
  it("fail to unzip something that isn't a zip", async () => {
    return expect(
      unzip(join(__dirname, 'tests', 'resources', 'bar.txt'), 'foobar'),
    ).rejects.toThrow();
  });

  it('unzips test.zip', async () => {
    const destination = join(tmpdir(), 'zip-test-' + Date.now());
    await unzip(join(__dirname, 'tests', 'resources', 'test.zip'), destination);

    const entries = await fs.readdir(destination, { withFileTypes: true });
    expect(entries.map(e => e.name)).toContain('foo.json');
    expect(entries.map(e => e.name)).toContain('bar.txt');
    expect(entries.map(e => e.name)).toContain('baz');

    const fooFile = entries.find(e => e.name === 'foo.json');
    const barFile = entries.find(e => e.name === 'bar.txt');
    const bazDir = entries.find(e => e.name === 'baz');

    expect(fooFile).toBeDefined();
    expect(barFile).toBeDefined();
    expect(bazDir).toBeDefined();

    expect(fooFile?.isFile()).toBeTruthy();
    expect(barFile?.isFile()).toBeTruthy();
    expect(bazDir?.isDirectory()).toBeTruthy();

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const bazEntries = await fs.readdir(join(destination, bazDir!.name), {
      withFileTypes: true,
    });

    expect(bazEntries).toHaveLength(1);
    expect(bazEntries.map(e => e.name)).toContain('qux.ts');

    const qux = await fs.readFile(join(destination, 'baz', 'qux.ts'));
    expect(qux.toString('utf-8')).toBe('console.log("qux");\n');

    const bar = await fs.readFile(join(destination, 'bar.txt'));
    expect(bar.toString('utf-8')).toBe('bar\n');

    const foo = await fs.readFile(join(destination, 'foo.json'));
    expect(foo.toString('utf-8')).toBe(JSON.stringify({ foo: 2 }, null, 4) + '\n');
  });

  it("fails to unzip something that doesn't exist", async () => {
    return expect(unzip('foobar', 'bazfoo')).rejects.toThrow();
  });
});

describe('zip', () => {
  it('zips objects', async () => {
    const objects: Array<{ name: string; object: any }> = [
      {
        name: 'firstObject',
        object: 2,
      },
      {
        name: 'secondObject',
        object: { baz: 'baz' },
      },
      {
        name: 'thirdObject',
        object: [2, { foo: 'foo' }, false],
      },
    ];

    const zipped = join(tmpdir(), `zip-test-${Date.now()}.zip`);
    await zip({
      destination: zipped,
      objects,
      paths: [],
    });

    const unzipped = join(tmpdir(), `zip-test-${Date.now()}`);
    await unzip(zipped, unzipped);

    for (const obj of objects) {
      const read = await fs
        .readFile(join(unzipped, obj.name))
        .then(read => JSON.parse(read.toString('utf-8')));
      expect(read).toEqual(obj.object);
    }
  });

  it('zips paths', async () => {
    const files = [
      join(__dirname, 'tests', 'resources', 'bar.txt'),
      join(__dirname, 'tests', 'resources', 'foo.json'),
      join(__dirname, 'tests', 'resources', 'baz'),
    ];
    const zipped = join(tmpdir(), `zip-test-${Date.now()}.zip`);
    await zip({ destination: zipped, objects: [], paths: files });

    const unzipped = join(tmpdir(), `zip-test-${Date.now()}`);
    await unzip(zipped, unzipped);

    const entries = await fs.readdir(unzipped, { withFileTypes: true });

    const bar = entries.find(e => e.name === 'bar.txt');
    const baz = entries.find(e => e.name === 'baz');
    const foo = entries.find(e => e.name === 'foo.json');

    expect(bar?.isFile()).toBeTruthy();
    expect(baz?.isDirectory()).toBeTruthy();
    expect(foo?.isFile()).toBeTruthy();
  });
});
