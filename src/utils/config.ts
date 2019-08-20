import { join } from 'path';
import { remote } from 'electron';

/**
 * root path where application data is stored
 */
export const dataPath = join(remote.app.getPath('userData'), 'data');
