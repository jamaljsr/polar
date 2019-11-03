import { remote } from 'electron';
import { debug, info } from 'electron-log';
import { join } from 'path';
import * as compose from 'docker-compose';
import Dockerode from 'dockerode';
import yaml from 'js-yaml';
import { LndNode } from 'shared/types';
import stripAnsi from 'strip-ansi';
import { DockerLibrary, DockerVersions, Network, NetworksFile } from 'types';
import { networksPath } from 'utils/config';
import { DOCKER_REPO } from 'utils/constants';
import { exists, read, write } from 'utils/files';
import ComposeFile from './composeFile';

class DockerService implements DockerLibrary {
  /**
   * Gets the versions of docker and docker-compose installed
   * @param throwOnError set to true to throw an Error if detection fails
   */
  async getVersions(throwOnError?: boolean): Promise<DockerVersions> {
    const versions = { docker: '', compose: '' };

    try {
      debug('fetching docker version');
      const dockerVersion = await new Dockerode().version();
      debug(`Result: ${JSON.stringify(dockerVersion)}`);
      versions.docker = dockerVersion.Version;
    } catch (error) {
      debug(`Failed: ${error.message}`);
      if (throwOnError) throw error;
    }

    try {
      debug('getting docker-compose version');
      const composeVersion = await this.execute(compose.version, this.getArgs());
      debug(`Result: ${JSON.stringify(composeVersion)}`);
      versions.compose = composeVersion.out.trim();
    } catch (error) {
      debug(`Failed: ${error.message}`);
      if (throwOnError) throw error;
    }

    return versions;
  }

  /**
   * Gets a list of the polar images that have already been pulled
   */
  async getImages(): Promise<string[]> {
    try {
      debug('fetching docker images');
      const allImages = await new Dockerode().listImages();
      debug(`All Images: ${JSON.stringify(allImages)}`);
      const prefix = `${DOCKER_REPO}/`;
      const polarImages = ([] as string[])
        .concat(...allImages.map(i => i.RepoTags))
        .filter(i => i.startsWith(prefix))
        .map(i => i.substr(prefix.length));
      debug(`Polar Images: ${JSON.stringify(polarImages)}`);
      return polarImages;
    } catch (error) {
      debug(`Failed: ${error.message}`);
      return [];
    }
  }

  /**
   * Save a docker-compose.yml file for the given network
   * @param network the network to save a compose file for
   */
  async saveComposeFile(network: Network) {
    const file = new ComposeFile();
    const { bitcoin, lightning } = network.nodes;

    bitcoin.forEach(node => file.addBitcoind(node));
    lightning.forEach(node => {
      if (node.implementation === 'LND') {
        const lnd = node as LndNode;
        const backend = bitcoin.find(n => n.name === lnd.backendName) || bitcoin[0];
        file.addLnd(lnd, backend);
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

  private getArgs(network?: Network) {
    return {
      cwd: network ? network.path : __dirname,
      env: {
        ...process.env,
        ...(remote && remote.process ? remote.process.env : {}),
      },
    };
  }
}

export default new DockerService();
