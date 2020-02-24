import { debug } from 'electron-log';
import { promises as fs } from 'fs';
import { copy } from 'fs-extra';
import { basename, join } from 'path';
import { IChart } from '@mrblenny/react-flow-chart';
import detectPort from 'detect-port';
import os, { tmpdir } from 'os';
import {
  BitcoinNode,
  CLightningNode,
  CommonNode,
  LightningNode,
  LndNode,
  NodeImplementation,
  Status,
} from 'shared/types';
import {
  CustomImage,
  DockerRepoImage,
  DockerRepoState,
  ManagedImage,
  Network,
} from 'types';
import { dataPath, networksPath, nodePath } from './config';
import { BasePorts, DOCKER_REPO } from './constants';
import { getName } from './names';
import { range } from './numbers';
import { isVersionCompatible } from './strings';
import { isWindows } from './system';
import { prefixTranslation } from './translate';
import { unzip, zip } from './zip';

const { l } = prefixTranslation('utils.network');

export const getContainerName = (node: CommonNode) =>
  `polar-n${node.networkId}-${node.name}`;

const groupNodes = (network: Network) => {
  const { bitcoin, lightning } = network.nodes;
  return {
    bitcoind: bitcoin.filter(n => n.implementation === 'bitcoind') as BitcoinNode[],
    lnd: lightning.filter(n => n.implementation === 'LND') as LndNode[],
    clightning: lightning.filter(
      n => n.implementation === 'c-lightning',
    ) as CLightningNode[],
    eclair: lightning.filter(n => n.implementation === 'eclair'),
  };
};

export const getImageCommand = (
  images: ManagedImage[],
  implementation: NodeImplementation,
  version: string,
): string => {
  const image = images.find(
    i => i.implementation === implementation && i.version === version,
  );
  if (!image) {
    throw new Error(
      `Unable to set docker image command for ${implementation} v${version}`,
    );
  }
  return image.command;
};

// long path games
export const getLndFilePaths = (name: string, network: Network) => {
  // returns /volumes/lnd/lnd-1
  const lndDataPath = (name: string) => nodePath(network, 'LND', name);
  // returns /volumes/lnd/lnd-1/tls.cert
  const lndCertPath = (name: string) => join(lndDataPath(name), 'tls.cert');
  // returns /data/chain/bitcoin/regtest
  const macaroonPath = join('data', 'chain', 'bitcoin', 'regtest');
  // returns /volumes/lnd/lnd-1/data/chain/bitcoin/regtest/admin.macaroon
  const lndMacaroonPath = (name: string, macaroon: string) =>
    join(lndDataPath(name), macaroonPath, `${macaroon}.macaroon`);

  return {
    tlsCert: lndCertPath(name),
    adminMacaroon: lndMacaroonPath(name, 'admin'),
    readonlyMacaroon: lndMacaroonPath(name, 'readonly'),
  };
};

export const filterCompatibleBackends = (
  implementation: LightningNode['implementation'],
  version: string,
  compatibility: DockerRepoImage['compatibility'],
  backends: BitcoinNode[],
): BitcoinNode[] => {
  // if compatibility is not defined, then allow all backend versions
  if (!compatibility || !compatibility[version]) return backends;
  const requiredVersion = compatibility[version];
  const compatibleBackends = backends.filter(n =>
    isVersionCompatible(n.version, requiredVersion),
  );
  if (compatibleBackends.length === 0) {
    throw new Error(
      l('backendCompatError', { requiredVersion, implementation, version }),
    );
  }
  return compatibleBackends;
};

export const createLndNetworkNode = (
  network: Network,
  version: string,
  compatibility: DockerRepoImage['compatibility'],
  docker: CommonNode['docker'],
  status = Status.Stopped,
): LndNode => {
  const { bitcoin, lightning } = network.nodes;
  const implementation: LndNode['implementation'] = 'LND';
  const backends = filterCompatibleBackends(
    implementation,
    version,
    compatibility,
    bitcoin,
  );
  const id = lightning.length ? Math.max(...lightning.map(n => n.id)) + 1 : 0;
  const name = getName(id);
  return {
    id,
    networkId: network.id,
    name: name,
    type: 'lightning',
    implementation,
    version,
    status,
    // alternate between backend nodes
    backendName: backends[id % backends.length].name,
    paths: getLndFilePaths(name, network),
    ports: {
      rest: BasePorts.LND.rest + id,
      grpc: BasePorts.LND.grpc + id,
      p2p: BasePorts.LND.p2p + id,
    },
    docker,
  };
};

export const createCLightningNetworkNode = (
  network: Network,
  version: string,
  compatibility: DockerRepoImage['compatibility'],
  docker: CommonNode['docker'],
  status = Status.Stopped,
): CLightningNode => {
  const { bitcoin, lightning } = network.nodes;
  const implementation: LndNode['implementation'] = 'c-lightning';
  const backends = filterCompatibleBackends(
    implementation,
    version,
    compatibility,
    bitcoin,
  );
  const id = lightning.length ? Math.max(...lightning.map(n => n.id)) + 1 : 0;
  const name = getName(id);
  const path = nodePath(network, 'c-lightning', name);
  return {
    id,
    networkId: network.id,
    name: name,
    type: 'lightning',
    implementation: 'c-lightning',
    version,
    status,
    // alternate between backend nodes
    backendName: backends[id % backends.length].name,
    paths: {
      macaroon: join(path, 'rest-api', 'access.macaroon'),
    },
    ports: {
      rest: BasePorts['c-lightning'].rest + id,
      p2p: BasePorts['c-lightning'].p2p + id,
    },
    docker,
  };
};

export const createBitcoindNetworkNode = (
  network: Network,
  version: string,
  docker: CommonNode['docker'],
  status = Status.Stopped,
): BitcoinNode => {
  const { bitcoin } = network.nodes;
  const id = bitcoin.length ? Math.max(...bitcoin.map(n => n.id)) + 1 : 0;

  const name = `backend${id + 1}`;
  const node: BitcoinNode = {
    id,
    networkId: network.id,
    name: name,
    type: 'bitcoin',
    implementation: 'bitcoind',
    version,
    peers: [],
    status,
    ports: {
      rpc: BasePorts.bitcoind.rest + id,
      zmqBlock: BasePorts.bitcoind.zmqBlock + id,
      zmqTx: BasePorts.bitcoind.zmqTx + id,
    },
    docker,
  };

  // peer up with the previous node on both sides
  if (bitcoin.length > 0) {
    const prev = bitcoin[bitcoin.length - 1];
    node.peers.push(prev.name);
    prev.peers.push(node.name);
  }

  return node;
};

const isNetwork = (value: any): value is Network => {
  return (
    typeof value === 'object' &&
    typeof value.id === 'number' &&
    typeof value.name === 'string' &&
    typeof value.status === 'number' &&
    typeof value.path === 'string' &&
    typeof value.nodes === 'object'
  );
};

const readNetwork = async (path: string, id: number): Promise<Network> => {
  const rawNetwork = await fs.readFile(path);
  const network = JSON.parse(rawNetwork.toString('utf-8'));
  if (!isNetwork(network)) {
    throw Error(`${path} did not contain a valid network!`);
  }

  network.path = join(dataPath, 'networks', id.toString());

  network.id = id;
  network.nodes.bitcoin.forEach(bitcoin => {
    bitcoin.networkId = id;
  });
  network.nodes.lightning.forEach(ln => {
    ln.networkId = id;
    if (ln.implementation === 'LND') {
      const lnd = ln as LndNode;
      lnd.paths = getLndFilePaths(lnd.name, network);
    } else if (ln.implementation === 'c-lightning') {
      const clightning = ln as CLightningNode;
      clightning.paths = {
        macaroon: join(
          network.path,
          'volumes',
          'c-lightning',
          clightning.name,
          'rest-api',
          'access.macaroon',
        ),
      };
    }
  });

  return network;
};

const isChart = (value: any): value is IChart =>
  typeof value === 'object' &&
  typeof value.offset === 'object' &&
  typeof value.nodes === 'object' &&
  typeof value.links === 'object' &&
  typeof value.selected === 'object' &&
  typeof value.hovered === 'object';

const readChart = async (path: string): Promise<IChart> => {
  const rawChart = await fs.readFile(path);
  const chart = JSON.parse(rawChart.toString('utf-8'));
  if (!isChart(chart)) {
    throw Error(`${path} did not contain a valid chart`);
  }

  return chart;
};

/**
 * @returns The newly created network, the chart corresponding to it
 *          and the destination of the unzipped files
 */
export const getNetworkFromZip = async (
  zip: string,
  newId: number,
): Promise<[Network, IChart, string]> => {
  const destination = join(os.tmpdir(), basename(zip, '.zip'));
  await unzip(zip, destination);

  const [network, chart] = await Promise.all([
    readNetwork(join(destination, 'network.json'), newId),
    readChart(join(destination, 'chart.json')),
  ]);

  return [network, chart, destination];
};

/**
 * Given a zip file and the existing networks in the app,
 * unpack the zipped files and save them to the correct
 * locations.
 *
 * The caller is responsible for persisting the network
 * and chart to the store.
 */
export const importNetworkFromZip = async (
  zipPath: string,
  existingNetworks: Network[],
): Promise<[Network, IChart]> => {
  const maxId = existingNetworks
    .map(n => n.id)
    .reduce((max, curr) => Math.max(max, curr), 0);
  const newId = maxId + 1;

  const [newNetwork, chart, unzippedFilesDirectory] = await getNetworkFromZip(
    zipPath,
    newId,
  );
  const networkHasCLightning = newNetwork.nodes.lightning.some(
    n => n.implementation === 'c-lightning',
  );

  if (isWindows() && networkHasCLightning) {
    throw Error(l('importClightningWindows'));
  }

  const newNetworkDirectory = join(dataPath, 'networks', newId.toString());
  await fs.mkdir(newNetworkDirectory, { recursive: true });

  const thingsToCopy = ['docker-compose.yml', 'volumes'];
  await Promise.all(
    thingsToCopy.map(path =>
      copy(join(unzippedFilesDirectory, path), join(newNetworkDirectory, path)),
    ),
  );

  return [newNetwork, chart];
};

const sanitizeFileName = (name: string): string => {
  const withoutSpaces = name.replace(/\s/g, '-'); // replace all whitespace with hyphens

  // remove all character which could lead to either unpleasant or
  // invalid file names
  return withoutSpaces.replace(/[^0-9a-zA-Z-._]/g, '');
};

/** Creates a suitable file name for a Zip archive of the given network */
export const zipNameForNetwork = (network: Network): string =>
  `polar-${sanitizeFileName(network.name)}.zip`;

/**
 * Archive the given network into a folder with the following content:
 *
 * ```
 * docker-compose.yml // compose file for network
 * volumes            // directory with all data files needed by nodes
 * network.json       // serialized network object
 * chart.json         // serialized chart object
 * ```
 *
 * @return Path of created `.zip` file
 */
export const zipNetwork = async (network: Network, chart: IChart): Promise<string> => {
  const destination = join(tmpdir(), zipNameForNetwork(network));

  await zip({
    destination,
    objects: [
      {
        name: 'network.json',
        object: network,
      },
      {
        name: 'chart.json',
        object: chart,
      },
    ],
    paths: [join(network.path, 'docker-compose.yml'), join(network.path, 'volumes')],
  });
  return destination;
};

export const createNetwork = (config: {
  id: number;
  name: string;
  lndNodes: number;
  clightningNodes: number;
  bitcoindNodes: number;
  repoState: DockerRepoState;
  managedImages: ManagedImage[];
  customImages: { image: CustomImage; count: number }[];
  status?: Status;
}): Network => {
  const {
    id,
    name,
    lndNodes,
    clightningNodes,
    bitcoindNodes,
    repoState,
    managedImages,
    customImages,
  } = config;
  // need explicit undefined check because Status.Starting is 0
  const status = config.status !== undefined ? config.status : Status.Stopped;

  const network: Network = {
    id: id,
    name,
    status,
    path: join(networksPath, id.toString()),
    nodes: {
      bitcoin: [],
      lightning: [],
    },
  };

  const { bitcoin, lightning } = network.nodes;
  const dockerWrap = (command: string) => ({ image: '', command });

  // add custom bitcoin nodes
  customImages
    .filter(i => i.image.implementation === 'bitcoind')
    .forEach(i => {
      const version = repoState.images.bitcoind.latest;
      const docker = { image: i.image.dockerImage, command: i.image.command };
      range(i.count).forEach(() => {
        bitcoin.push(createBitcoindNetworkNode(network, version, docker, status));
      });
    });

  // add managed bitcoin noes
  range(bitcoindNodes).forEach(() => {
    const version = repoState.images.bitcoind.latest;
    const cmd = getImageCommand(managedImages, 'bitcoind', version);
    bitcoin.push(createBitcoindNetworkNode(network, version, dockerWrap(cmd), status));
  });

  // add custom lightning nodes
  customImages
    .filter(
      i => i.image.implementation === 'LND' || i.image.implementation === 'c-lightning',
    )
    .forEach(({ image, count }) => {
      const { latest, compatibility } = repoState.images.LND;
      const docker = { image: image.dockerImage, command: image.command };
      const createFunc =
        image.implementation === 'LND'
          ? createLndNetworkNode
          : createCLightningNetworkNode;
      range(count).forEach(() => {
        lightning.push(createFunc(network, latest, compatibility, docker, status));
      });
    });

  // add lightning nodes in an alternating pattern
  range(Math.max(lndNodes, clightningNodes)).forEach(i => {
    if (i < lndNodes) {
      const { latest, compatibility } = repoState.images.LND;
      const cmd = getImageCommand(managedImages, 'LND', latest);
      lightning.push(
        createLndNetworkNode(network, latest, compatibility, dockerWrap(cmd), status),
      );
    }
    if (i < clightningNodes) {
      const { latest, compatibility } = repoState.images['c-lightning'];
      const cmd = getImageCommand(managedImages, 'c-lightning', latest);
      lightning.push(
        createCLightningNetworkNode(
          network,
          latest,
          compatibility,
          dockerWrap(cmd),
          status,
        ),
      );
    }
  });

  return network;
};

/**
 * Returns the images needed to start a network that are not included in the list
 * of images already pulled
 * @param network the network to check
 * @param pulled the list of images already pulled
 */
export const getMissingImages = (network: Network, pulled: string[]): string[] => {
  const { bitcoin, lightning } = network.nodes;
  const neededImages = [...bitcoin, ...lightning].map(n => {
    // use the custom image name if specified
    if (n.docker.image) return n.docker.image;
    // convert implementation to image name: LND -> lnd, c-lightning -> clightning
    const impl = n.implementation.toLocaleLowerCase().replace(/-/g, '');
    return `${DOCKER_REPO}/${impl}:${n.version}`;
  });
  // exclude images already pulled
  const missing = neededImages.filter(i => !pulled.includes(i));
  // filter out duplicates
  const unique = missing.filter((image, index) => missing.indexOf(image) === index);
  if (unique.length)
    debug(`The network '${network.name}' is missing docker images`, unique);
  return unique;
};

/**
 * Checks a range of port numbers to see if they are open on the current operating system.
 * Returns a new array of port numbers that are confirmed available
 * @param requestedPorts the ports to check for availability. ** must be in ascending order
 *
 * @example if port 10002 is in use
 * getOpenPortRange([10001, 10002, 10003]) -> [10001, 10004, 10005]
 */
export const getOpenPortRange = async (requestedPorts: number[]): Promise<number[]> => {
  const openPorts: number[] = [];

  for (let port of requestedPorts) {
    if (openPorts.length) {
      // adjust to check after the previous open port if necessary, since the last
      // open port may have increased
      const lastOpenPort = openPorts[openPorts.length - 1];
      if (port <= lastOpenPort) {
        port = lastOpenPort + 1;
      }
    }
    openPorts.push(await detectPort(port));
  }
  return openPorts;
};

export interface OpenPorts {
  [key: string]: {
    rpc?: number;
    grpc?: number;
    rest?: number;
    zmqBlock?: number;
    zmqTx?: number;
    p2p?: number;
  };
}

/**
 * Checks if the ports specified on the nodes are available on the host OS. If not,
 * return new ports that are confirmed available
 * @param network the network with nodes to verify ports of
 */
export const getOpenPorts = async (network: Network): Promise<OpenPorts | undefined> => {
  const ports: OpenPorts = {};

  // filter out nodes that are already started since their ports are in use by themselves
  const bitcoin = network.nodes.bitcoin.filter(n => n.status !== Status.Started);
  if (bitcoin.length) {
    let existingPorts = bitcoin.map(n => n.ports.rpc);
    let openPorts = await getOpenPortRange(existingPorts);
    if (openPorts.join() !== existingPorts.join()) {
      openPorts.forEach((port, index) => {
        ports[bitcoin[index].name] = { rpc: port };
      });
    }

    existingPorts = bitcoin.map(n => n.ports.zmqBlock);
    openPorts = await getOpenPortRange(existingPorts);
    if (openPorts.join() !== existingPorts.join()) {
      openPorts.forEach((port, index) => {
        ports[bitcoin[index].name] = {
          ...(ports[bitcoin[index].name] || {}),
          zmqBlock: port,
        };
      });
    }

    existingPorts = bitcoin.map(n => n.ports.zmqTx);
    openPorts = await getOpenPortRange(existingPorts);
    if (openPorts.join() !== existingPorts.join()) {
      openPorts.forEach((port, index) => {
        ports[bitcoin[index].name] = {
          ...(ports[bitcoin[index].name] || {}),
          zmqTx: port,
        };
      });
    }
  }

  let { lnd, clightning } = groupNodes(network);

  // filter out nodes that are already started since their ports are in use by themselves
  lnd = lnd.filter(n => n.status !== Status.Started);
  if (lnd.length) {
    let existingPorts = lnd.map(n => n.ports.grpc);
    let openPorts = await getOpenPortRange(existingPorts);
    if (openPorts.join() !== existingPorts.join()) {
      openPorts.forEach((port, index) => {
        ports[lnd[index].name] = { grpc: port };
      });
    }

    existingPorts = lnd.map(n => n.ports.rest);
    openPorts = await getOpenPortRange(existingPorts);
    if (openPorts.join() !== existingPorts.join()) {
      openPorts.forEach((port, index) => {
        ports[lnd[index].name] = {
          ...(ports[lnd[index].name] || {}),
          rest: port,
        };
      });
    }

    existingPorts = lnd.map(n => n.ports.p2p);
    openPorts = await getOpenPortRange(existingPorts);
    if (openPorts.join() !== existingPorts.join()) {
      openPorts.forEach((port, index) => {
        ports[lnd[index].name] = {
          ...(ports[lnd[index].name] || {}),
          p2p: port,
        };
      });
    }
  }

  clightning = clightning.filter(n => n.status !== Status.Started);
  if (clightning.length) {
    let existingPorts = clightning.map(n => n.ports.rest);
    let openPorts = await getOpenPortRange(existingPorts);
    if (openPorts.join() !== existingPorts.join()) {
      openPorts.forEach((port, index) => {
        ports[clightning[index].name] = { rest: port };
      });
    }

    existingPorts = clightning.map(n => n.ports.p2p);
    openPorts = await getOpenPortRange(existingPorts);
    if (openPorts.join() !== existingPorts.join()) {
      openPorts.forEach((port, index) => {
        ports[clightning[index].name] = {
          ...(ports[clightning[index].name] || {}),
          p2p: port,
        };
      });
    }
  }

  // return undefined if no ports where updated
  return Object.keys(ports).length > 0 ? ports : undefined;
};
