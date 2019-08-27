import * as compose from 'docker-compose';
import { join } from 'path';
import { info } from 'electron-log';
import { dataPath } from 'utils/config';
import { Network, DockerLibrary } from 'types';

class DockerService implements DockerLibrary {
  async start(network: Network) {
    const networkPath = join(dataPath, 'networks', network.id.toString());
    info(`Starting docker containers for ${network.name}`);
    info(` - path: ${networkPath}`);
    const result = await compose.upAll({ cwd: networkPath });
    info(`Network started:`);
    info(result.out || result.err);
  }

  async stop(network: Network) {
    const networkPath = join(dataPath, 'networks', network.id.toString());
    info(`Stopping docker containers for ${network.name}`);
    info(` - path: ${networkPath}`);
    const result = await compose.stop({ cwd: networkPath });
    info(`Network started:`);
    info(result.out || result.err);
  }
}

export default new DockerService();
