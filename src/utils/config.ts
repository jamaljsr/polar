import { remote } from 'electron';
import { join } from 'path';

/**
 * root path where application data is stored
 */
export const dataPath = join(remote.app.getPath('userData'), 'data');
/**
 * path where networks data is stored
 */
export const networksPath = join(dataPath, 'networks');
