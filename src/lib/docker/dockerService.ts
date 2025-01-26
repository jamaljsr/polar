import { remote } from 'electron';
import { debug, info } from 'electron-log';
import { copy, ensureDir } from 'fs-extra';
import { join } from 'path';
import { v2 as compose } from 'docker-compose';
import Dockerode from 'dockerode';
import yaml from 'js-yaml';
import os from 'os';
import {
  AnyNode,
  BitcoinNode,
  CLightningNode,
  CommonNode,
  EclairNode,
  LightningNode,
  LitdNode,
  LndNode,
  TapdNode,
} from 'shared/types';
import stripAnsi from 'strip-ansi';
import { DockerLibrary, DockerVersions, Network, NetworksFile } from 'types';
import { legacyDataPath, networksPath, nodePath } from 'utils/config';
import { APP_VERSION, dockerConfigs } from 'utils/constants';
import { exists, read, renameFile, rm, write } from 'utils/files';
import { migrateNetworksFile } from 'utils/migrations';
import { isLinux, isMac } from 'utils/system';
import ComposeFile from './composeFile';

type SimulationNode = {
  id: string;
  address: string;
  macaroon?: string;
  cert?: string;
  ca_cert?: string;
  client_cert?: string;
  client_key?: string;
};

type SimulationActivity = {
  source: string;
  destination: string;
  interval_secs: number;
  amount_msat: number;
};

let dockerInst: Dockerode | undefined;
/**
 * Creates a new Dockerode instance by detecting the docker socket
 */
export const getDocker = async (useCached = true): Promise<Dockerode> => {
  // re-use the stored instance if available
  if (useCached && dockerInst) return dockerInst;

  if (remote.process.env.DOCKER_HOST) {
    debug('DOCKER_HOST detected. Copying DOCKER_* env vars:');
    // copy all env vars that start with DOCKER_ to the current process env
    Object.keys(remote.process.env)
      .filter(key => key.startsWith('DOCKER_'))
      .forEach(key => {
        debug(`- ${key} = '${remote.process.env[key]}'`);
        process.env[key] = remote.process.env[key];
      });
    // let Dockerode handle DOCKER_HOST parsing
    return (dockerInst = new Dockerode());
  }
  if (isLinux() || isMac()) {
    // try to detect the socket path in the default locations on linux/mac
    const socketPaths = [
      `${remote.process.env.HOME}/.docker/run/docker.sock`,
      `${remote.process.env.HOME}/.docker/desktop/docker.sock`,
      '/var/run/docker.sock',
    ];
    for (const socketPath of socketPaths) {
      if (await exists(socketPath)) {
        debug('docker socket detected:', socketPath);
        return (dockerInst = new Dockerode({ socketPath }));
      }
    }
  }

  debug('no DOCKER_HOST or docker socket detected');
  // fallback to letting Dockerode detect the socket path
  return (dockerInst = new Dockerode());
};

class DockerService implements DockerLibrary {
  /**
   * Gets the versions of docker and docker compose installed
   * @param throwOnError set to true to throw an Error if detection fails
   */
  async getVersions(throwOnError?: boolean): Promise<DockerVersions> {
    const versions = { docker: '', compose: '' };

    try {
      debug('fetching docker version');
      const dockerVersion = await (await getDocker()).version();
      debug(`Result: ${JSON.stringify(dockerVersion)}`);
      versions.docker = dockerVersion.Version;
    } catch (error: any) {
      debug(`Failed: ${error.message}`);
      if (throwOnError) throw error;
    }

    try {
      debug('getting docker compose version');
      const composeVersion = await this.execute(compose.version, this.getArgs());
      debug(`Result: ${JSON.stringify(composeVersion)}`);
      versions.compose = composeVersion.out.trim();
    } catch (error: any) {
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
      const allImages = await (await getDocker()).listImages();
      debug(`All Images: ${JSON.stringify(allImages)}`);
      const imageNames = ([] as string[])
        .concat(...allImages.map(i => i.RepoTags || []))
        .filter(n => n !== '<none>:<none>'); // ignore untagged images
      const uniqueNames = imageNames.filter(
        (image, index) => imageNames.indexOf(image) === index,
      );
      debug(`Image Names: ${JSON.stringify(uniqueNames)}`);
      return uniqueNames;
    } catch (error: any) {
      debug(`Failed: ${error.message}`);
      return [];
    }
  }

  /**
   * Save a docker-compose.yml file for the given network
   * @param network the network to save a compose file for
   */
  async saveComposeFile(network: Network) {
    const file = new ComposeFile(network.id);
    const { bitcoin, lightning, tap } = network.nodes;

    bitcoin.forEach(node => file.addBitcoind(node));
    lightning.forEach(node => {
      if (node.implementation === 'LND') {
        const lnd = node as LndNode;
        const backend = bitcoin.find(n => n.name === lnd.backendName) || bitcoin[0];
        file.addLnd(lnd, backend);
      }
      if (node.implementation === 'c-lightning') {
        const cln = node as CLightningNode;
        const backend = bitcoin.find(n => n.name === cln.backendName) || bitcoin[0];
        file.addClightning(cln, backend);
      }
      if (node.implementation === 'eclair') {
        const eclair = node as EclairNode;
        const backend = bitcoin.find(n => n.name === eclair.backendName) || bitcoin[0];
        file.addEclair(eclair, backend);
      }
      if (node.implementation === 'litd') {
        const litd = node as LitdNode;
        const backend = bitcoin.find(n => n.name === litd.backendName) || bitcoin[0];
        file.addLitd(litd, backend);
      }
    });
    tap.forEach(node => {
      if (node.implementation === 'tapd') {
        const tapd = node as TapdNode;
        const lndBackend =
          lightning.find(n => n.name === tapd.lndName) ||
          lightning.filter(n => n.implementation === 'LND')[0];
        file.addTapd(tapd, lndBackend as LndNode);
      }
    });

    if (network.simulationActivities.length > 0) {
      file.addSimLn(network.id);
    }

    const yml = yaml.dump(file.content);
    const path = join(network.path, 'docker-compose.yml');
    await write(path, yml);
    info(`saved compose file for '${network.name}' at '${path}'`);
  }

  /**
   * Start a network using docker compose
   * @param network the network to start
   */
  async start(network: Network) {
    const { bitcoin, lightning, tap } = network.nodes;
    await this.ensureDirs(network, [...bitcoin, ...lightning, ...tap]);

    info(`Starting docker containers for ${network.name}`);
    info(` - path: ${network.path}`);

    // we don't want to start the simln service when starting the network
    // because it depends on the running lightning nodes and the simulation
    // activity should be started separately based on user preference
    const servicesToStart = this.getServicesToStart(
      [...bitcoin, ...lightning, ...tap],
      ['simln'],
    );

    for (const service of servicesToStart) {
      const result = await this.execute(compose.upOne, service, this.getArgs(network));
      info(`Network started: ${service}\n ${result.out || result.err}`);
    }
  }

  /**
   * Filter out services based on exclude list and return a list of service names to start
   * @param nodes Array of all nodes
   * @param exclude Array of container names to exclude
   */
  private getServicesToStart(
    nodes:
      | CommonNode[]
      | {
          name: 'simln';
        }[],
    exclude: string[],
  ): string[] {
    return nodes
      .map(node => node.name)
      .filter(serviceName => !exclude.includes(serviceName));
  }

  /**
   * Stop a network using docker compose
   * @param network the network to stop
   */
  async stop(network: Network) {
    info(`Stopping docker containers for ${network.name}`);
    info(` - path: ${network.path}`);
    const result = await this.execute(compose.down, this.getArgs(network));
    info(`Network stopped:\n ${result.out || result.err}`);
  }

  /**
   * Starts a single service using docker compose
   * @param network the network containing the node
   * @param node the node to start
   */
  async startNode(network: Network, node: CommonNode) {
    await this.ensureDirs(network, [node]);
    // make sure the docker container is stopped. If it is already started in an error state
    // then starting it would have no effect
    await this.stopNode(network, node);

    info(`Starting docker container for ${node.name}`);
    info(` - path: ${network.path}`);
    const result = await this.execute(compose.upOne, node.name, this.getArgs(network));
    info(`Container started:\n ${result.out || result.err}`);
  }

  /**
   * Stops a single service using docker compose
   * @param network the network containing the node
   * @param node the node to stop
   */
  async stopNode(network: Network, node: CommonNode) {
    info(`Stopping docker container for ${node.name}`);
    info(` - path: ${network.path}`);
    const result = await this.execute(compose.stopOne, node.name, this.getArgs(network));
    info(`Container stopped:\n ${result.out || result.err}`);
  }

  /**
   * Removes a single service from the network using docker compose
   * @param network the network containing the node
   * @param node the node to remove
   */
  async removeNode(network: Network, node: CommonNode) {
    info(`Stopping docker container for ${node.name}`);
    info(` - path: ${network.path}`);
    let result = await this.execute(compose.stopOne, node.name, this.getArgs(network));
    info(`Container stopped:\n ${result.out || result.err}`);

    info(`Removing stopped docker containers`);
    // the `any` cast is used because `rm` is the only method on compose that takes the
    // IDockerComposeOptions as the first param and a spread for the remaining
    result = await this.execute(compose.rm as any, this.getArgs(network), node.name);
    info(`Removed:\n ${result.out || result.err}`);
  }

  /**
   * Renames the docker volume directory on disk when a node is renamed
   * @param network the network containing the node
   * @param node the node that's to be renamed
   * @param newName the new name for the node and directory
   */
  async renameNodeDir(network: Network, node: AnyNode, newName: string) {
    const oldPath = nodePath(network, node.implementation, node.name);
    const newPath = nodePath(network, node.implementation, newName);

    if (node.implementation === 'LND') {
      const certPath = (node as LndNode).paths.tlsCert;
      const keyPath = certPath.replace('.cert', '.key');
      // need to delete the tls cert so that it is recreated with the new hostname
      if (await exists(certPath)) await rm(certPath);
      if (await exists(keyPath)) await rm(keyPath);
    }

    if (await exists(oldPath)) renameFile(oldPath, newPath);
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

    // copy network data from previous version path if necessary
    const legacyNetworksExist = await exists(join(legacyDataPath, 'networks'));
    if (!(await exists(path)) && legacyNetworksExist) {
      await this.copyLegacyData();
    }

    const emptyFile = { version: APP_VERSION, networks: [], charts: {} };
    if (await exists(path)) {
      try {
        const json = await read(path);
        let data = JSON.parse(json);
        info(`loaded ${data.networks.length} networks from '${path}'`);
        // migrate data when the version differs or running locally
        if (data.version !== APP_VERSION || process.env.NODE_ENV !== 'production') {
          data = migrateNetworksFile(data);
          await this.saveNetworks(data);
        }
        return data;
      } catch (err: any) {
        info(`failed to parse networks from '${path}'`, err);
        return emptyFile;
      }
    } else {
      info(`skipped loading networks because the file '${path}' doesn't exist`);
      return emptyFile;
    }
  }

  /**
   * copies the network data from the v0.1.0 path to the new path
   */
  async copyLegacyData(): Promise<void> {
    const legacyPath = join(legacyDataPath, 'networks');
    try {
      info(`copying data from v0.1.0 app dir '${legacyPath}' to '${networksPath}'`);
      await copy(legacyPath, networksPath);
    } catch (error: any) {
      info(`failed to copy folder\nfrom: ${legacyPath}\nto: ${networksPath}\n`, error);
    }
  }

  /**
   * Constructs the contents of sim.json file for the simulation activity
   * @param network the network to start
   */
  constructSimJson(network: Network) {
    const simJson: {
      nodes: SimulationNode[];
      activity: SimulationActivity[];
    } = {
      nodes: [],
      activity: [],
    };

    network.simulationActivities.forEach(activity => {
      const { source, destination } = activity;
      const nodeArray = [source, destination];

      for (const node of nodeArray) {
        let simNode: SimulationNode;

        // split the macaroon and cert path at "volumes/" to get the relative path
        // to the docker volume. This is necessary because the docker volumes are
        // mounted as a different path in the container.
        switch (node.implementation) {
          case 'LND':
            const lnd = node as LndNode;
            simNode = {
              id: lnd.name,
              macaroon: `/home/simln/.${lnd.paths.adminMacaroon.split('volumes/').pop()}`,
              address: `https://host.docker.internal:${lnd.ports.grpc}`,
              cert: `/home/simln/.${lnd.paths.tlsCert.split('volumes/').pop()}`,
            };
            break;

          case 'c-lightning':
            const cln = node as CLightningNode;
            simNode = {
              id: cln.name,
              address: `https://host.docker.internal:${cln.ports.grpc}`,
              ca_cert: `/home/simln/.${cln.paths?.tlsCert?.split('volumes/').pop()}`,
              client_cert: `/home/simln/.${cln.paths?.tlsClientCert
                ?.split('volumes/')
                .pop()}`,
              client_key: `/home/simln/.${cln.paths?.tlsClientKey
                ?.split('volumes/')
                .pop()}`,
            };
            break;

          default:
            throw new Error(`unsupported node type ${node.implementation}`);
        }

        // console.log(`simNode >> \n ${JSON.stringify(simNode)}`);
        // Add the node to the nodes Set (duplicates are automatically handled)
        simJson.nodes.push(simNode);
      }

      // Add the activity
      const simActivity: SimulationActivity = {
        source: activity.source.name,
        destination: activity.destination.name,
        interval_secs: activity.intervalSecs,
        amount_msat: activity.amountMsat * 1000,
      };

      // console.log(`simActivity >> \n ${JSON.stringify(simActivity)}`);
      // Add the activity to the activity Set (duplicates are automatically handled)
      simJson.activity.push(simActivity);
    });
    return {
      nodes: [...new Map(simJson.nodes.map(node => [node['id'], node])).values()],
      activity: [
        ...new Map(
          simJson.activity.map(activity => [
            `${activity.source}-${activity.destination}`,
            activity,
          ]),
        ).values(),
      ],
    };
  }

  /**
   * Start a simulation activity in the network using docker compose
   * @param network the network containing the simulation activity
   */
  async startSimulationActivity(network: Network) {
    const simJson = this.constructSimJson(network);
    // console.log(`simJson >> \n ${JSON.stringify(simJson)}`);
    await this.ensureDirs(network, [
      ...network.nodes.bitcoin,
      ...network.nodes.lightning,
      ...network.nodes.tap,
    ]);
    const simjsonPath = nodePath(network, 'simln', 'sim.json');
    await write(simjsonPath, JSON.stringify(simJson));
    console.log(`simjsonPath >> \n ${JSON.stringify(simjsonPath)}`);
    const result = await this.execute(compose.upOne, 'simln', this.getArgs(network));
    info(`Simulation activity started:\n ${result.out || result.err}`);
  }

  async stopSimulationActivity(network: Network) {
    info(`[stopSimulationActivity] \n ${network}`);
  }

  /**
   * Helper method to trap and format exceptions thrown and
   * @param cmd the compose function to call
   * @param args the arguments to the compose function
   */
  private async execute<A, B>(
    cmd: (arg1: A, arg2?: B) => Promise<compose.IDockerComposeResult>,
    arg1: A,
    arg2?: B,
  ): Promise<compose.IDockerComposeResult> {
    try {
      const result = await cmd(arg1, arg2);
      result.out = stripAnsi(result.out);
      result.err = stripAnsi(result.err);
      return result;
    } catch (e: any) {
      e.err = stripAnsi(e.err);
      info(`docker cmd failed: ${JSON.stringify(e)}`);
      throw new Error(e.err || JSON.stringify(e));
    }
  }

  private getArgs(network?: Network) {
    const args = {
      cwd: network ? network.path : __dirname,
      env: {
        ...process.env,
        ...(remote && remote.process ? remote.process.env : {}),
      },
    };

    if (isLinux()) {
      const { uid, gid } = os.userInfo();
      debug(`env: uid=${uid} gid=${gid}`);
      args.env = {
        ...args.env,
        // add user/group id's to env so that file permissions on the
        // docker volumes are set correctly. containers cannot write
        // to disk on linux if permissions aren't set correctly
        USERID: `${uid}`,
        GROUPID: `${gid}`,
      };
    }

    return args;
  }

  private async ensureDirs(network: Network, nodes: CommonNode[]) {
    // create the directory so the owner is the current host user
    // if this isn't done, then docker will create the folders
    // owned by root and linux containers won't start up due to
    // permission errors
    for (const commonNode of nodes) {
      // need to cast so typescript doesn't complain about 'implementation'
      const node = commonNode as LightningNode | BitcoinNode;
      const nodeDir = nodePath(network, node.implementation, node.name);
      await ensureDir(nodeDir);
      if (node.implementation === 'c-lightning') {
        const { dataDir, apiDir } = dockerConfigs['c-lightning'];
        await ensureDir(join(nodeDir, dataDir as string));
        await ensureDir(join(nodeDir, apiDir as string));
      } else if (node.implementation === 'litd') {
        await ensureDir(join(nodeDir, 'lit'));
        await ensureDir(join(nodeDir, 'lnd'));
        await ensureDir(join(nodeDir, 'tapd'));
      }
    }
  }
}

export default new DockerService();
