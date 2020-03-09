import { error, info, warn } from 'electron-log';
import { createReadStream, createWriteStream, pathExists } from 'fs-extra';
import { join } from 'path';
import archiver from 'archiver';
import unzipper from 'unzipper';

/**
 * Extracts a zip file into the specified folder
 * @param filePath the path to the zip file
 * @param destination the folder to extract to
 */
export const unzip = (filePath: string, destination: string): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    try {
      const exists = await pathExists(filePath);
      if (!exists) {
        throw Error(`${filePath} does not exist!`);
      }
      const stream = createReadStream(filePath).pipe(
        unzipper.Extract({ path: destination }),
      );

      stream.on('close', resolve);
      stream.on('error', err => {
        error(`Could not unzip ${filePath} into ${destination}:`, err);
        reject(err);
      });
    } catch (err) {
      reject(err);
    }
  });
};

/**
 * Zips the contents of a folder
 * @param source the folder path containing the files to zip
 * @param destination the file path of where to store the zip
 */
export const zip = (source: string, destination: string): Promise<void> =>
  new Promise(async (resolve, reject) => {
    info(`zipping ${source} to ${destination}`);
    const output = createWriteStream(destination);
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

    // avoid including the c-lightning RPC socket
    const entryData: archiver.EntryDataFunction = entry => {
      if (entry.name?.endsWith(join('lightningd', 'regtest', 'lightning-rpc'))) {
        info('skipping', entry);
        return false;
      }
      return entry;
    };
    // append files from a sub-directory, putting its contents at the root of archive
    archive.directory(source, false, entryData);

    // we've added all files, tell this to the archive so it can emit the 'close' event
    // once all streams have finished
    archive.finalize();
  });
