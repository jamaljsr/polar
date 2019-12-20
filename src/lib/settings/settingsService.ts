import { debug } from 'electron-log';
import { join } from 'path';
import { AppSettings, SettingsInjection } from 'types';
import { dataPath } from 'utils/config';
import { exists, read, write } from 'utils/files';

class SettingsService implements SettingsInjection {
  /**
   * The path to the settings file
   */
  filePath = join(dataPath, 'settings.json');

  /**
   * Saves the given settings to the file system
   * @param settings the list of settings to save
   */
  async save(data: AppSettings) {
    const json = JSON.stringify(data, null, 2);
    await write(this.filePath, json);
    debug(`saved settings to '${this.filePath}'`, json);
  }

  /**
   * Loads settings from the file system
   */
  async load(): Promise<AppSettings | undefined> {
    if (await exists(this.filePath)) {
      const json = await read(this.filePath);
      const data = JSON.parse(json);
      debug(`loaded app settings from '${this.filePath}'`, data);
      return data;
    } else {
      debug(
        `skipped loading app settings because the file '${this.filePath}' doesn't exist`,
      );
    }
  }
}

export default new SettingsService();
