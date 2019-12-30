import { debug } from 'electron-log';
import { join } from 'path';
import { NodeImplementation } from 'shared/types';
import { DockerRepoState, DockerRepoUpdates, RepoServiceInjection } from 'types';
import { dataPath } from 'utils/config';
import { REPO_STATE_URL } from 'utils/constants';
import { exists, read, write } from 'utils/files';

class RepoService implements RepoServiceInjection {
  /**
   * The path to the state file
   */
  filePath = join(dataPath, 'nodes.json');

  /**
   * Saves the given state to the file system
   * @param state the list of state to save
   */
  async save(data: DockerRepoState) {
    const json = JSON.stringify(data, null, 2);
    await write(this.filePath, json);
    debug(`saved repo state to '${this.filePath}'`, json);
  }

  /**
   * Loads state from the file system
   */
  async load(): Promise<DockerRepoState | undefined> {
    if (await exists(this.filePath)) {
      const json = await read(this.filePath);
      const data = JSON.parse(json);
      debug(`loaded repo state from '${this.filePath}'`, data);
      return data;
    } else {
      debug(
        `skipped loading repo state because the file '${this.filePath}' doesn't exist`,
      );
    }
  }

  /**
   * Checks to see if there are new docker images available to use
   * @param localState the current repo state stored locally
   */
  async checkForUpdates(localState: DockerRepoState): Promise<DockerRepoUpdates> {
    debug('Checking for new versions of docker images');
    debug(` - local state: \n${JSON.stringify(localState)}`);
    const remoteState = await this.fetchRemote();
    debug(` - local date: ${new Date(localState.updated)}`);
    debug(` - remote date: ${new Date(remoteState.updated)}`);
    // don't return any updates if the remote state is older
    if (remoteState.updated <= localState.updated) {
      debug('No image updates found');
      return { state: localState };
    }
    // initialize the updated versions
    const updates: DockerRepoUpdates['updates'] = {
      LND: [],
      'c-lightning': [],
      eclair: [],
      bitcoind: [],
      btcd: [],
    };
    // find the different versions between the two states
    let newVersionCount = 0;
    Object.entries(remoteState.images).forEach(([name, remoteImage]) => {
      const impl = name as NodeImplementation;
      const localVersions = localState.images[impl].versions;
      const newVersions = remoteImage.versions.filter(v => !localVersions.includes(v));
      if (newVersions.length) {
        newVersionCount += newVersions.length;
        updates[impl].push(...newVersions);
      }
    });
    debug(` - ${newVersionCount} available updates: ${JSON.stringify(updates)}`);
    if (newVersionCount === 0) {
      debug('No new image versions found');
      return { state: localState };
    }
    // return the new state and the updates
    return { state: remoteState, updates };
  }

  /**
   * Fetch the nodes.json file from a remote URL
   */
  async fetchRemote(): Promise<DockerRepoState> {
    debug(`Fetching remote repo state:`);
    debug(` - url: ${REPO_STATE_URL}`);
    const response = await fetch(REPO_STATE_URL);
    const state = await response.json();
    debug(` - response: \n${JSON.stringify(state)}`);
    return state;
  }
}

export default new RepoService();
