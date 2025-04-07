import { outputFile, pathExists, readFile, remove, rename } from 'fs-extra';
import { isAbsolute, join } from 'path';
import { waitFor } from './async';
import { dataPath } from './config';
import { debug, info } from 'electron-log';

export const abs = (path: string): string =>
  isAbsolute(path) ? path : join(dataPath, path);

/**
 * Writes data to file located in the app's data directory
 * @param filePath the path to the file. either absolute or relative to the app's data dir
 * @param content the contents of the file
 */
export const write = async (filePath: string, content: string | Buffer) =>
  await outputFile(abs(filePath), content);

/**
 * Reads data from a file located in the app's data directory
 * @param filePath the path to the file. either absolute or relative to the app's data dir
 */
export const read = async (
  filePath: string,
  encoding?: BufferEncoding,
): Promise<string> => (await readFile(abs(filePath))).toString(encoding);

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
 * Returns a promise that will resolve when the file exists or the timeout expires
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

/**
 * Renames directory from ${oldPath} to ${newPath} when a node is renamed
 * @param oldPath is the path to the directory with the old node name
 * @param newPath is the new path to the same directory with the new node name
 */
export const renameFile = async (oldPath: string, newPath: string): Promise<void> => {
  try {
    await rename(abs(oldPath), abs(newPath));
    info(`File renamed successfully from ${oldPath} to ${newPath}`);
  } catch (err) {
    debug('Error occurred while renaming file:', err);
  }
};
