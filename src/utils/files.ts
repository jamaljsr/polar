import { outputFile, pathExists, readFile } from 'fs-extra';
import { isAbsolute, join } from 'path';
import { dataPath } from './config';

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
export const read = async (filePath: string): Promise<string> =>
  (await readFile(abs(filePath))).toString();

/**
 * Checks to see if a file exists
 * @param filePath the path to the file. either absolute or relative to the app's data dir
 */
export const exists = async (filePath: string): Promise<boolean> =>
  await pathExists(abs(filePath));

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
): Promise<boolean> => {
  const path = abs(filePath);
  // if the file already exists, then return immediately
  if (await exists(path)) {
    return Promise.resolve(true);
  }
  // return a promise that will resolve when the file exists
  return new Promise(resolve => {
    // keep a countdown of the number of times to check
    // so it can abort after a the timeout expires
    let timesToCheck = timeout / interval;
    const timer = setInterval(async () => {
      if (await exists(path)) {
        clearInterval(timer);
        return resolve(true);
      }
      if (timesToCheck < 0) {
        clearInterval(timer);
        return resolve(false);
      }
      // decrement the number of times to check in each iteration
      timesToCheck -= 1;
    }, interval);
  });
};
