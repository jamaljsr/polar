import { join } from 'path';
import { remote } from 'electron';

export const dataPath = join(remote.app.getPath('userData'), 'data');
