import { error, info, warn } from 'electron-log';
import fs from 'fs';
import { createWriteStream, pathExists } from 'fs-extra';
import { join } from 'path';
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

export const zip = (source: string, destination: string): Promise<void> =>
  new Promise(async (resolve, reject) => {
    info('zipping', source, 'to', destination);
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
    const entryDataFunction: archiver.EntryDataFunction = entry => {
      if (entry.name?.endsWith(join('lightningd', 'regtest', 'lightning-rpc'))) {
        console.info('skipping', entry);
        return false;
      }
      return entry;
    };
    // append files from a sub-directory, putting its contents at the root of archive
    archive.directory(source, false, entryDataFunction);

    // we've added all files, tell this to the archive so it can emit the 'close' event
    // once all streams have finished
    archive.finalize();
  });
