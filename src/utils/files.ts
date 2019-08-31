import { promises as fs } from 'fs';
import { dirname, isAbsolute, join } from 'path';
import { dataPath } from './config';

/**
 * Writes data to file located in the app's data directory
 * @param filePath the path to the file. either absolute or relative to the app's data dir
 * @param content the contents of the file
 */
export const writeDataFile = async (filePath: string, content: string) => {
  const absPath = isAbsolute(filePath) ? filePath : join(dataPath, filePath);
  const dirPath = dirname(absPath);
  await fs.mkdir(dirPath, { recursive: true });
  await fs.writeFile(absPath, content);
};

/**
 * Reads data from a file located in the app's data directory
 * @param filePath the path to the file. either absolute or relative to the app's data dir
 */
export const readDataFile = async (filePath: string): Promise<string> => {
  const absPath = isAbsolute(filePath) ? filePath : join(dataPath, filePath);
  return (await fs.readFile(absPath)).toString();
};
