import * as compose from 'docker-compose';
import { join } from 'path';
import { info } from 'electron-log';
import { dataPath } from 'utils/config';
import { Network, DockerLibrary } from 'types';

class DockerService implements DockerLibrary {
  async start(network: Network) {
    const networkPath = join(dataPath, network.id.toString());
    info(`Starting docker containers for ${network.name}`);
    const result = await compose.upAll({ cwd: networkPath });
    info(`Network started:`);
    info(result);
  }
}

export default new DockerService();
