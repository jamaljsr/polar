import { info } from 'electron-log';
import { join } from 'path';
import { AppSettings, SettingsInjection } from 'types';
import { dataPath } from 'utils/config';
import { exists, read, write } from 'utils/files';

class SettingsService implements SettingsInjection {
  /**
   * Saves the given settings to the file system
   * @param settings the list of settings to save
   */
  async save(data: AppSettings) {
    const json = JSON.stringify(data, null, 2);
    const path = join(dataPath, 'settings.json');
    await write(path, json);
    info(`saved settings to '${path}'`, json);
  }

  /**
   * Loads a list of settings from the file system
   */
  async load(): Promise<AppSettings | undefined> {
    const path = join(dataPath, 'settings.json');
    if (await exists(path)) {
      const json = await read(path);
      const data = JSON.parse(json);
      info(`loaded app settings from '${path}'`, data);
      return data;
    } else {
      info(`skipped loading app settings because the file '${path}' doesn't exist`);
    }
  }
}

export default new SettingsService();
