import { outputFile, pathExists, readFile, remove } from 'fs-extra';
import unzipper from 'unzipper';
import fs, { promises as fsPromises } from 'fs';
import path from 'path';
import log from 'electron-log';
import os from 'os';
import archiver from 'archiver';
import { isAbsolute, join } from 'path';
import { waitFor } from './async';
import { dataPath } from './config';
import { Network } from 'types';
import { IChart } from '@mrblenny/react-flow-chart';

const abs = (path: string): string => (isAbsolute(path) ? path : join(dataPath, path));

/**
 * Writes data to file located in the app's data directory
 * @param filePath the path to the file. either absolute or relative to the app's data dir
 * @param content the contents of the file
 */
export const write = async (filePath: string, content: string) =>
  await outputFile(abs(filePath), content);

/**
 * Reads data from a file located in the app's data directory
 * @param filePath the path to the file. either absolute or relative to the app's data dir
 */
export const read = async (filePath: string, encoding?: string): Promise<string> =>
  (await readFile(abs(filePath))).toString(encoding);

/**
 * Checks to see if a file exists
 * @param filePath the path to the file. either absolute or relative to the app's data dir
 */
export const exists = async (filePath: string): Promise<boolean> =>
  await pathExists(abs(filePath));

/**
 * Deletes a file or directory from disk. The directory can have contents. Like `rm -rf`
 * @param path the path to the file or directory. either absolute or relative to the app's data dir
 */
export const rm = async (path: string): Promise<void> => await remove(abs(path));

/**
 * Adds a raw string into the ZIP archive
 *
 * @param archive ZIP archive to add the file to
 * @param content content to add into archive
 * @param nameInArchive name of file in archive
 */
const addStringToZip = async (
  archive: archiver.Archiver,
  content: string,
  nameInArchive: string,
) => {
  return archive.append(content, { name: nameInArchive });
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
  return archive.append(await fsPromises.readFile(filePath), { name: nameInArchive });
};

// Generate a sequence of all regular files inside the given directory
async function* getFiles(dir: string): AsyncGenerator<string> {
  const dirents = await fsPromises.readdir(dir, { withFileTypes: true });
  for (const dirent of dirents) {
    const res = path.resolve(dir, dirent.name);
    if (dirent.isDirectory()) {
      yield* getFiles(res);
    } else if (dirent.isFile()) {
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
  const pathExists = await exists(filePath);
  if (!pathExists) {
    throw Error(`cannot zip nonexistant path: ${filePath}`);
  }

  const isDir = await fsPromises.lstat(filePath).then(res => res.isDirectory());
  if (isDir) {
    log.info('Adding directory to zip file:', filePath);
    for await (const file of getFiles(filePath)) {
      // a typical file might look like this:
      //   /home/user/.polar/networks/1/volumes/bitcoind/backend1/regtest/mempool.dat
      // after applying this transformation, we end up with:
      //   volumes/bitcoind/backend1/regtest/mempool.dat
      const nameInArchive = path.join(
        path.basename(filePath),
        file.slice(filePath.length),
      );
      await addFileToZip(archive, file, nameInArchive);
    }
  } else {
    return addFileToZip(archive, filePath, path.basename(filePath));
  }
};

/**
 * Archive the given network into a folder with the following content:
 *
 * ```
 * docker-compose.yml // compose file for network
 * volumes            // directory with all data files needed by nodes
 * network.json       // serialized network object
 * chart.json         // serialized chart object
 * ```
 *
 * @return Path of created `.zip` file
 */
export const zipNetwork = async (network: Network, chart: IChart): Promise<string> => {
  return new Promise(async (resolve, reject) => {
    const zipPath = join(os.tmpdir(), `polar-${network.name}.zip`);
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip');

    // finished
    archive.on('finish', () => resolve(zipPath));
    archive.on('error', err => {
      log.error(`got error when zipping ${zipPath}:`, err);
      reject(err);
    });

    archive.on('warning', warning => {
      log.warn(`got warning when zipping ${zipPath}:`, warning);
      reject(warning);
    });

    // pipe all zipped data to the output
    archive.pipe(output);

    const paths = ['docker-compose.yml', 'volumes'];
    await Promise.all([
      addStringToZip(archive, JSON.stringify(network), 'network.json'),
      addStringToZip(archive, JSON.stringify(chart), 'chart.json'),
      ...paths.map(p => addFileOrDirectoryToZip(archive, path.join(network.path, p))),
    ]);

    // we've added all files, tell this to the archive so it can emit the 'close' event
    // once all streams have finished
    archive.finalize();
  });
};

/**
 * Unzips `zip` into `destination`
 */
export const unzip = (zip: string, destination: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const stream = fs.createReadStream(zip).pipe(unzipper.Extract({ path: destination }));

    stream.on('close', resolve);
    stream.on('error', reject);
  });
};

/**
 * Returns a promise that will ressolve when the file exists or the timeout expires
 * @param filePath the path to the file. either absolute or relative to the app's data dir
 * @param interval the interval to check if the file exists
 * @param timeout the absolute timeout to abort checking
 */
export const waitForFile = async (
  filePath: string,
  interval = 500,
  timeout = 5000,
): Promise<void> => {
  const path = abs(filePath);
  return waitFor(
    async () => {
      if (!(await exists(path))) {
        throw new Error(`File does not exist: ${path}`);
      }
    },
    interval,
    timeout,
  );
};
