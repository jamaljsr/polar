import { error, info, warn } from 'electron-log';
import fs from 'fs';
import { pathExists } from 'fs-extra';
import { basename, join, resolve } from 'path';
import archiver from 'archiver';
import unzipper from 'unzipper';

/**
 * Unzips `zip` into `destination`
 */
export const unzip = (zip: string, destination: string): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    try {
      const exists = await pathExists(zip);
      if (!exists) {
        throw Error(`${zip} does not exist!`);
      }
      const stream = fs
        .createReadStream(zip)
        .pipe(unzipper.Extract({ path: destination }));

      stream.on('close', resolve);
      stream.on('error', err => {
        error(`Could not unzip ${zip} into ${destination}:`, err);
        reject(err);
      });
    } catch (err) {
      reject(err);
    }
  });
};

interface ZipArgs {
  /** The destination of the generated zip */
  destination: string;
  objects: Array<{
    /** Object to serialize (with `JSON.stringify`) and store in the zip */
    object: any;
    /** Name of this object in the generated zip */
    name: string;
  }>;
  /** Files or folders to include  */
  paths: string[];
}

/**
 * Adds a raw string into the ZIP archive
 *
 * @param archive ZIP archive to add the file to
 * @param content content to add into archive
 * @param nameInArchive name of file in archive
 */
const addStringToZip = (
  archive: archiver.Archiver,
  content: string,
  nameInArchive: string,
): void => {
  try {
    archive.append(content, { name: nameInArchive });
  } catch (err) {
    error(`Could not add ${nameInArchive} to zip: ${err}`);
    throw err;
  }
};

/**
 * Adds a file to the given ZIP archive. We read the file into
 * memory and then append it to the ZIP archive. There appears
 * to be issues with using Archiver.js with Electron/Webpack,
 * so that's why we have to do it in a somewhat inefficient way.
 *
 * Related issues:
 *  * https://github.com/archiverjs/node-archiver/issues/349
 *  * https://github.com/archiverjs/node-archiver/issues/403
 *  * https://github.com/archiverjs/node-archiver/issues/174
 *
 * @param archive ZIP archive to add the file to
 * @param filePath file to add, absolute path
 * @param nameInArchive name of file in archive
 */
const addFileToZip = async (
  archive: archiver.Archiver,
  filePath: string,
  nameInArchive: string,
) => {
  return archive.append(await fs.promises.readFile(filePath), { name: nameInArchive });
};

// Generate a sequence of all regular files inside the given directory
async function* getFiles(dir: string): AsyncGenerator<string> {
  const entries = await fs.promises.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const res = resolve(dir, entry.name);
    if (entry.isDirectory()) {
      yield* getFiles(res);
    } else if (entry.isFile()) {
      yield res;
    }
  }
}

/**
 * Add the given path to the archive. If it's a file we add it directly, it it is a directory
 * we recurse over all the files within that directory
 *
 * @param archive ZIP archive to add the file to
 * @param filePath file to add, absolute path
 */
const addFileOrDirectoryToZip = async (archive: archiver.Archiver, filePath: string) => {
  const isDir = await fs.promises.lstat(filePath).then(res => res.isDirectory());
  if (isDir) {
    info('Adding directory to zip file:', filePath);
    for await (const file of getFiles(filePath)) {
      // a typical file might look like this:
      //   /home/user/.polar/networks/1/volumes/bitcoind/backend1/regtest/mempool.dat
      // after applying this transformation, we end up with:
      //   volumes/bitcoind/backend1/regtest/mempool.dat
      const nameInArchive = join(basename(filePath), file.slice(filePath.length));
      await addFileToZip(archive, file, nameInArchive);
    }
  } else {
    return addFileToZip(archive, filePath, basename(filePath));
  }
};

export const zip = ({ destination, objects, paths }: ZipArgs): Promise<void> =>
  new Promise(async (resolve, reject) => {
    const output = fs.createWriteStream(destination);
    const archive = archiver('zip');

    // finished
    archive.on('finish', () => resolve());
    archive.on('error', err => {
      error(`got error when zipping ${destination}:`, err);
      reject(err);
    });

    archive.on('warning', warning => {
      warn(`got warning when zipping ${destination}:`, warning);
      reject(warning);
    });

    // pipe all zipped data to the output
    archive.pipe(output);

    const pathPromises = paths.map(p => addFileOrDirectoryToZip(archive, p));

    for (const obj of objects) {
      addStringToZip(archive, JSON.stringify(obj.object), obj.name);
    }

    await Promise.all(pathPromises);

    // we've added all files, tell this to the archive so it can emit the 'close' event
    // once all streams have finished
    archive.finalize();
  });
