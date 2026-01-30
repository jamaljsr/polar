import { remote } from 'electron';
import { debug, info } from 'electron-log';
import { copy, ensureDir } from 'fs-extra';
import { dirname, join } from 'path';
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
import {
  ActivityConfig,
  DockerLibrary,
  DockerVersions,
  Network,
  NetworksFile,
  SimulationNodeConfig,
} from 'types';
import { legacyDataPath, networksPath, nodePath } from 'utils/config';
import { APP_VERSION, dockerConfigs, eclairCredentials } from 'utils/constants';
import { exists, read, renameFile, rm, write } from 'utils/files';
import { migrateNetworksFile } from 'utils/migrations';
import { getContainerName } from 'utils/network';
import { isLinux, isMac, isWindows } from 'utils/system';
import ComposeFile from './composeFile';

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

    bitcoin.forEach(node => {
      if (node.implementation === 'bitcoind') {
        file.addBitcoind(node);
      }
      if (node.implementation === 'btcd') {
        file.addBtcd(node);
      }
    });
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
        // Always set the first litd node as the proof courier, even if it's the same node
        const proofCourier = lightning.find(n => n.implementation === 'litd') as LitdNode;
        file.addLitd(litd, backend, proofCourier);
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

    if (network.simulation) {
      file.addSimln(network.id);
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
    const result = await this.execute(compose.upAll, this.getArgs(network));
    info(`Network started:\n ${result.out || result.err}`);
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

    // btcd nodes have a companion btcwallet service that must also be started
    if ((node as BitcoinNode).implementation === 'btcd') {
      const walletName = `btcwallet-${node.name}`;
      info(`Starting companion btcwallet container for ${node.name}`);
      const walletResult = await this.execute(
        compose.upOne,
        walletName,
        this.getArgs(network),
      );
      info(`btcwallet container started:\n ${walletResult.out || walletResult.err}`);
    }
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

    // btcd nodes have a companion btcwallet service that must also be stopped
    if ((node as BitcoinNode).implementation === 'btcd') {
      const walletName = `btcwallet-${node.name}`;
      info(`Stopping companion btcwallet container for ${node.name}`);
      const walletResult = await this.execute(
        compose.stopOne,
        walletName,
        this.getArgs(network),
      );
      info(`btcwallet container stopped:\n ${walletResult.out || walletResult.err}`);
    }
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

    // btcd nodes have a companion btcwallet service that must also be removed
    if ((node as BitcoinNode).implementation === 'btcd') {
      const walletName = `btcwallet-${node.name}`;
      info(`Stopping companion btcwallet container for ${node.name}`);
      result = await this.execute(compose.stopOne, walletName, this.getArgs(network));
      info(`btcwallet container stopped:\n ${result.out || result.err}`);

      info(`Removing btcwallet container`);
      result = await this.execute(compose.rm as any, this.getArgs(network), walletName);
      info(`btcwallet removed:\n ${result.out || result.err}`);
    }
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

    // handle CLN named volume on Windows
    if (node.implementation === 'c-lightning' && isWindows()) {
      // delete stale certs so they're re-fetched from container after restart
      for (const certPath of [
        (node as CLightningNode).paths.tlsCert,
        (node as CLightningNode).paths.tlsClientCert,
        (node as CLightningNode).paths.tlsClientKey,
      ]) {
        if (certPath && (await exists(certPath))) await rm(certPath);
      }

      await this.renameCLNVolume(network, node as CLightningNode, newName);
      if (await exists(oldPath)) await renameFile(oldPath, newPath);
      return;
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
      } else if (node.implementation === 'btcd') {
        await ensureDir(join(nodeDir, 'btcd'));
        // each btcd node has a companion btcwallet container which is not included
        // in the network's nodes, so its dir must be created here as well
        await ensureDir(this.btcwalletDir(network, node.name));
      }
    }
  }

  /**
   * Returns the path to the data dir of the btcwallet container which accompanies
   * the given btcd node
   */
  private btcwalletDir(network: Network, btcdName: string) {
    return join(
      network.path,
      'volumes',
      'btcwallet',
      `btcwallet-${btcdName}`,
      'btcwallet',
    );
  }

  /**
   * Constructs the contents of sim.json file for the simulation
   *
   * @param network the network to start
   */
  constructSimJson(network: Network) {
    // Helper function to convert Windows paths to POSIX path format.
    const getPosixPath = (path = '') => {
      // Normalize to POSIX separators for Windows paths.
      const norm = path.replace(/\\/g, '/');

      const parts = norm.split('volumes/');

      return parts[parts.length - 1];
    };
    const simJson: {
      nodes: SimulationNodeConfig[];
      activity: ActivityConfig[];
    } = {
      nodes: [],
      activity: [],
    };

    const simulation = network.simulation;
    if (!simulation) return { nodes: [], activity: [] };

    const { activity } = simulation;
    const { lightning } = network.nodes;

    activity.forEach(a => {
      const { source, destination, intervalSecs, amountMsat } = a;
      const nodeNames = [source, destination];

      for (const nodeName of nodeNames) {
        let simNode: SimulationNodeConfig;

        const node = lightning.find(n => n.name === nodeName);
        if (!node) {
          throw new Error(`Node ${nodeName} not found in network`);
        }

        // Split the macaroon and cert path at "volumes/" to get the relative path
        // to the docker volume. This is necessary because the docker volumes are
        // mounted as a different path in the container.
        switch (node.implementation) {
          case 'LND':
            const lnd = node as LndNode;
            simNode = {
              id: lnd.name,
              macaroon: `/home/simln/.${getPosixPath(lnd.paths.adminMacaroon)}`,
              address: `https://${getContainerName(node)}:10009`,
              cert: `/home/simln/.${getPosixPath(lnd.paths.tlsCert)}`,
            };
            break;

          case 'eclair':
            const eclair = node as EclairNode;
            simNode = {
              id: eclair.name,
              base_url: `http://${getContainerName(node)}:8080`,
              api_username: '',
              api_password: eclairCredentials.pass,
            };
            break;

          case 'c-lightning':
            const cln = node as CLightningNode;
            simNode = {
              id: cln.name,
              address: `${getContainerName(node)}:11001`,
              ca_cert: `/home/simln/.${getPosixPath(cln.paths.tlsCert)}`,
              client_cert: `/home/simln/.${getPosixPath(cln.paths.tlsClientCert)}`,
              client_key: `/home/simln/.${getPosixPath(cln.paths.tlsClientKey)}`,
            };
            break;

          case 'litd':
            const litd = node as LitdNode;
            simNode = {
              id: litd.name,
              address: `${getContainerName(node)}:10009`,
              cert: `/home/simln/.${getPosixPath(litd.paths.tlsCert)}`,
              macaroon: `/home/simln/.${getPosixPath(litd.paths.adminMacaroon)}`,
            };
            break;
        }

        // Add the node to the nodes Set.
        simJson.nodes.push(simNode);
      }

      // Add the activity
      const activity: ActivityConfig = {
        source: source,
        destination: destination,
        interval_secs: intervalSecs,
        amount_msat: amountMsat,
      };

      // Add the activity to the activity Set.
      simJson.activity.push(activity);
    });

    // Remove duplicate nodes.
    const uniqueNodes = [...new Map(simJson.nodes.map(node => [node.id, node])).values()];

    return {
      nodes: uniqueNodes,
      activity: simJson.activity,
    };
  }

  /**
   * Start a simulation in the network using docker compose
   * @param network the network containing the simulation
   */
  async startSimulation(network: Network) {
    await this.ensureDirs(network, [
      ...network.nodes.bitcoin,
      ...network.nodes.lightning,
      ...network.nodes.tap,
    ]);
    // we need to create this dir as the current host user, otherwise it will be created
    // by the simln container and the owner will be set to root on linux. This prevents
    // deleting the network due to file permission errors.
    await ensureDir(nodePath(network, 'simln', 'results'));

    // save the sim.json file for the simulation
    const simJson = this.constructSimJson(network);
    const simJsonPath = nodePath(network, 'simln', 'sim.json');
    await write(simJsonPath, JSON.stringify(simJson));

    // start the simln container
    const result = await this.execute(compose.upOne, 'simln', this.getArgs(network));
    info(`Simulation started:\n ${result.out || result.err}`);
  }

  async stopSimulation(network: Network) {
    info(`Stopping simulation for ${network.name}`);
    const result = await this.execute(compose.stopOne, 'simln', this.getArgs(network));
    info(`Simulation stopped:\n ${result.out || result.err}`);
  }

  async removeSimulation(network: Network) {
    info(`Stopping docker container for simulation`);
    let result = await this.execute(compose.stopOne, 'simln', this.getArgs(network));
    info(`Simulation stopped:\n ${result.out || result.err}`);

    info(`Removing stopped docker containers`);
    result = await this.execute(compose.rm as any, this.getArgs(network), 'simln');
    info(`Simulation removed:\n ${result.out || result.err}`);
  }

  /**
   * Copies the CLN named volume's contents to the host filesystem on Windows.
   *
   * On Windows, CLN's data directory is a named Docker volume, not a host bind
   * mount, so the host folder doesn't contain hsm_secret, the channel database,
   * or the gossip store. Network export reads from the host folder, so without
   * this copy the exported zip is missing all node state.
   */
  async copyVolumeToHost(node: CLightningNode) {
    if (!isWindows()) return;

    const log = (...args: any[]) => debug(`DockerService ${node.name}:`, ...args);

    // node.paths.rune is volumes/c-lightning/<name>/lightningd/admin.rune
    const hostDataDir = dirname(node.paths.rune).replace(/\\/g, '/');
    await ensureDir(hostDataDir);

    const containerName = getContainerName(node);
    const volumeName = `polar-network-${node.networkId}_${containerName}`;
    const image =
      node.docker.image || `${dockerConfigs['c-lightning'].imageName}:${node.version}`;

    log(`copying volume '${volumeName}' to host '${hostDataDir}'`);

    const docker = await getDocker();
    let helper: Dockerode.Container | undefined;
    try {
      helper = await docker.createContainer({
        Image: image,
        Entrypoint: ['/bin/sh', '-c'],
        Cmd: [
          'rm -f /dest/regtest/lightning-rpc && ' +
            'cd /source && tar --exclude=lightning-rpc -cf - . | tar -xf - -C /dest',
        ],
        HostConfig: {
          Binds: [`${volumeName}:/source:ro`, `${hostDataDir}:/dest`],
        },
      });
      await helper.start();
      const result = await helper.wait();
      if (result.StatusCode !== 0) {
        const logBuf = await helper.logs({ stdout: true, stderr: true, follow: false });
        throw new Error(
          `Failed to copy CLN volume '${volumeName}': exit ${result.StatusCode}. ` +
            `Output: ${logBuf.toString().trim()}`,
        );
      }
    } finally {
      if (helper) {
        await helper
          .remove({ force: true })
          .catch(err => log(`failed to remove helper container: ${err.message}`));
      }
    }
  }

  /**
   * Removes the CLN named Docker volume on Windows.
   */
  async removeCLNVolume(node: CLightningNode) {
    if (!isWindows()) return;

    const log = (...args: any[]) => debug(`CLightningService ${node.name}:`, ...args);

    const containerName = getContainerName(node);
    const volumeName = `polar-network-${node.networkId}_${containerName}`;

    try {
      const docker = await getDocker();
      await docker.getVolume(volumeName).remove();
      log(`removed named volume '${volumeName}'`);
    } catch (err: any) {
      // 404 = volume doesn't exist (node never started, or already removed)
      if (err.statusCode === 404) {
        log(`named volume '${volumeName}' did not exist, nothing to remove`);
      } else {
        log(`failed to remove named volume '${volumeName}': ${err.message}`);
      }
    }
  }

  /**
   * rename CLN named volume on windows
   * @param network the network containing the node
   * @param node the node to be renamed
   * @param newName the new name for the node and directory
   */
  private async renameCLNVolume(network: Network, node: CLightningNode, newName: string) {
    const docker = await getDocker();
    const networkName = `polar-network-${network.id}`;
    const oldContainerName = getContainerName(node);
    const newContainerName = `polar-n${network.id}-${newName}`;
    const oldVolumeName = `${networkName}_${oldContainerName}`;
    const newVolumeName = `${networkName}_${newContainerName}`;

    info(`Renaming CLN Docker volume: ${oldVolumeName} → ${newVolumeName}`);

    const clnImage =
      node.docker.image || `${dockerConfigs['c-lightning'].imageName}:${node.version}`;
    await docker.createVolume({ Name: newVolumeName });
    const copyContainer = await docker.createContainer({
      Image: clnImage,
      Cmd: ['sh', '-c', `cp -a /src/. /dst/`],
      HostConfig: {
        Binds: [`${oldVolumeName}:/src:ro`, `${newVolumeName}:/dst`],
      },
    });

    let copySuccessful = false;
    try {
      await copyContainer.start({});
      const result = await copyContainer.wait();
      info(`CLN volume copy exited with status: ${result.StatusCode}`);
      if (result.StatusCode !== 0) {
        throw new Error(`Volume copy failed with exit code ${result.StatusCode}`);
      }
      copySuccessful = true;
    } finally {
      await copyContainer.remove({ force: true });
      if (!copySuccessful) {
        try {
          await docker.getVolume(newVolumeName).remove();
        } catch (e) {
          info(`Failed to clean up new volume ${newVolumeName}: ${e}`);
        }
      }
    }

    info(`CLN volume rename complete: ${oldVolumeName} → ${newVolumeName}`);

    // remove the old volume now that data has been copied
    try {
      await docker.getVolume(oldVolumeName).remove();
      info(`Removed old CLN volume ${oldVolumeName}`);
    } catch (e) {
      info(`Failed to remove old volume ${oldVolumeName}: ${e}`);
    }
  }

  /**
   * Copies CLN data from the host folder into the named Docker volume on Windows.
   * @param node the CLN node to seed the volume for
   */
  async copyHostToVolume(node: CLightningNode) {
    if (!isWindows()) return;

    const hostDataDir = dirname(node.paths.rune).replace(/\\/g, '/');
    if (!(await exists(join(hostDataDir, 'regtest', 'hsm_secret')))) {
      info(`No CLN state found in '${hostDataDir}', skipping volume seed`);
      return;
    }

    const containerName = getContainerName(node);
    const volumeName = `polar-network-${node.networkId}_${containerName}`;
    const image =
      node.docker.image || `${dockerConfigs['c-lightning'].imageName}:${node.version}`;

    const docker = await getDocker();

    try {
      await docker.getImage(image).inspect();
    } catch {
      info(`Pulling image '${image}' to seed CLN volume`);
      const stream = await docker.pull(image);
      await new Promise((resolve, reject) => {
        docker.modem.followProgress(stream, (err, res) =>
          err ? reject(err) : resolve(res),
        );
      });
    }

    info(`Seeding CLN volume '${volumeName}' from '${hostDataDir}'`);
    await docker.createVolume({ Name: volumeName });
    const helper = await docker.createContainer({
      Image: image,
      Entrypoint: ['/bin/sh', '-c'],
      Cmd: [
        'cd /source && tar --exclude=lightning-rpc -cf - . | tar -xf - -C /dest && ' +
          'chown -R 1000:1000 /dest',
      ],
      HostConfig: {
        Binds: [`${hostDataDir}:/source:ro`, `${volumeName}:/dest`],
      },
    });

    let copySuccessful = false;
    try {
      await helper.start();
      const result = await helper.wait();
      if (result.StatusCode !== 0) {
        const logBuf = await helper.logs({ stdout: true, stderr: true, follow: false });
        throw new Error(
          `Failed to seed CLN volume '${volumeName}': exit ${result.StatusCode}. ` +
            `Output: ${logBuf.toString().trim()}`,
        );
      }
      copySuccessful = true;
    } finally {
      await helper.remove({ force: true }).catch(e => {
        info(`Failed to remove helper container: ${e.message}`);
      });
      if (!copySuccessful) {
        await docker
          .getVolume(volumeName)
          .remove()
          .catch(e => info(`Failed to clean up volume ${volumeName}: ${e}`));
      }
    }
  }
}

export default new DockerService();
