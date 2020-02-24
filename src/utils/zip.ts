import { error, warn } from 'electron-log';
import fs from 'fs';
import { pathExists } from 'fs-extra';
import { basename } from 'path';
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
  archive.append(content, { name: nameInArchive });
  return;
};

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
    archive.directory(filePath, basename(filePath));
  } else {
    archive.file(filePath, { name: basename(filePath) });
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
