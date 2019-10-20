import { remote } from 'electron';
import { info } from 'electron-log';
import { join } from 'path';
import * as compose from 'docker-compose';
import yaml from 'js-yaml';
import stripAnsi from 'strip-ansi';
import { DockerLibrary, Network, NetworksFile } from 'types';
import { networksPath } from 'utils/config';
import { exists, read, write } from 'utils/files';
import ComposeFile from './composeFile';
import { LndNode } from 'shared/types';

class DockerService implements DockerLibrary {
  /**
   * Save a docker-compose.yml file for the given network
   * @param network the network to save a compose file for
   */
  async saveComposeFile(network: Network) {
    const file = new ComposeFile();

    const prefix = (name: string) => `polar-n${network.id}-${name}`;
    network.nodes.bitcoin.forEach(node => {
      file.addBitcoind(prefix(node.name), node.version, node.ports.rpc);
    });
    network.nodes.lightning.forEach(node => {
      if (node.implementation === 'LND') {
        const lnd = node as LndNode;
        file.addLnd(
          prefix(lnd.name),
          lnd.version,
          prefix(lnd.backendName),
          lnd.ports.rest,
          lnd.ports.grpc,
        );
      }
    });

    const yml = yaml.dump(file.content);
    const path = join(network.path, 'docker-compose.yml');
    await write(path, yml);
    info(`created compose file for '${network.name}' at '${path}'`);
  }

  /**
   * Start a network using docper-compose
   * @param network the network to start
   */
  async start(network: Network) {
    info(`Starting docker containers for ${network.name}`);
    info(` - path: ${network.path}`);
    const result = await this.execute(compose.upAll, this.getArgs(network));
    info(`Network started:\n ${result.out || result.err}`);
  }

  /**
   * Stop a network using docker-compose
   * @param network the network to stop
   */
  async stop(network: Network) {
    info(`Stopping docker containers for ${network.name}`);
    info(` - path: ${network.path}`);
    const result = await this.execute(compose.down, this.getArgs(network));
    info(`Network stopped:\n ${result.out || result.err}`);
  }

  /**
   * Helper method to trap and format exceptions thrown and
   * @param cmd the compose function to call
   * @param args the arguments to the compose function
   */
  private async execute<A>(
    cmd: (args: A) => Promise<compose.IDockerComposeResult>,
    args: A,
  ): Promise<compose.IDockerComposeResult> {
    try {
      const result = await cmd(args);
      result.out = stripAnsi(result.out);
      result.err = stripAnsi(result.err);
      return result;
    } catch (e) {
      e.err = stripAnsi(e.err);
      info(`docker cmd failed: ${JSON.stringify(e)}`);
      throw new Error(e.err || JSON.stringify(e));
    }
  }

  /**
   * Saves the given networks to disk
   * @param networks the list of networks to save
   */
  async saveNetworks(data: NetworksFile) {
    const json = JSON.stringify(data, null, 2);
    const path = join(networksPath, 'networks.json');
    await write(path, json);
    info(`saved networks to '${path}'`);
  }

  /**
   * Loads a list of networks from the file system
   */
  async loadNetworks(): Promise<NetworksFile> {
    const path = join(networksPath, 'networks.json');
    if (await exists(path)) {
      const json = await read(path);
      const networks = JSON.parse(json);
      info(`loaded ${networks.length} networks from '${path}'`);
      return networks;
    } else {
      info(`skipped loading networks because the file '${path}' doesn't exist`);
      return { networks: [], charts: {} };
    }
  }

  private getArgs(network: Network) {
    return {
      cwd: network.path,
      env: {
        ...process.env,
        ...(remote ? remote.process.env : {}),
      },
    };
  }
}

export default new DockerService();
