import { info } from 'electron-log';
import { join } from 'path';
import * as compose from 'docker-compose';
import yaml from 'js-yaml';
import { DockerLibrary, Network } from 'types';
import { networksPath } from 'utils/config';
import { readDataFile, writeDataFile } from 'utils/files';
import ComposeFile from './composeFile';

class DockerService implements DockerLibrary {
  /**
   * Create a docker-compose.yml file for the given network
   * @param network the network to create a compose file for
   */
  async create(network: Network) {
    const file = new ComposeFile();

    const prefix = (name: string) => `polar-n${network.id}-${name}`;
    network.nodes.bitcoin.forEach(node => {
      file.addBitcoind(prefix(node.name));
    });
    network.nodes.lightning.forEach(node => {
      file.addLnd(prefix(node.name), prefix(node.backendName));
    });

    const yml = yaml.dump(file.content);
    const path = join(network.path, 'docker-compose.yml');
    await writeDataFile(path, yml);
    info(`created compose file for '${network.name}' at '${path}'`);
  }

  /**
   * Start a network using docper-compose
   * @param network the network to start
   */
  async start(network: Network) {
    info(`Starting docker containers for ${network.name}`);
    info(` - path: ${network.path}`);
    const result = await this.execute(compose.upAll, { cwd: network.path });
    info(`Network started:\n ${result.out || result.err}`);
  }

  /**
   * Stop a network using docker-compose
   * @param network the network to stop
   */
  async stop(network: Network) {
    info(`Stopping docker containers for ${network.name}`);
    info(` - path: ${network.path}`);
    const result = await this.execute(compose.stop, { cwd: network.path });
    info(`Network started:\n ${result.out || result.err}`);
  }

  /**
   * Helper method to trap and format exceptions thrown and
   * @param cmd the compose function to call
   * @param args the arguments to the compose function
   */
  private async execute<T, A>(cmd: (args: A) => Promise<T>, args: A): Promise<T> {
    try {
      return await cmd(args);
    } catch (e) {
      info(`docker cmd failed: ${JSON.stringify(e)}`);
      throw new Error(e.err);
    }
  }

  /**
   * Saves the given networks to disk
   * @param networks the list of networks to save
   */
  async save(networks: Network[]) {
    const json = JSON.stringify(networks, null, 2);
    const path = join(networksPath, 'networks.json');
    await writeDataFile(path, json);
    info(`saved networks to '${path}'`);
  }

  /**
   * Loads a list of networks from the file system
   */
  async load(): Promise<Network[]> {
    const path = join(networksPath, 'networks.json');
    const json = await readDataFile(path);
    const networks = JSON.parse(json);
    info(`loaded ${networks.length} networks from '${path}'`);
    return networks;
  }
}

export default new DockerService();
