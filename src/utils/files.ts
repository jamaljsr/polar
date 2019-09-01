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
 * Checkes to see if a file exists
 * @param filePath the path to the file. either absolute or relative to the app's data dir
 */
export const exists = async (filePath: string): Promise<boolean> =>
  await pathExists(abs(filePath));
