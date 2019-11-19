import { join } from 'path';
import detectPort from 'detect-port';
import {
  BitcoinNode,
  CommonNode,
  LightningdNode,
  LightningdVersion,
  LndNode,
  LndVersion,
  Status,
} from 'shared/types';
import { Network } from 'types';
import { networksPath } from './config';
import { BasePorts } from './constants';
import { getName } from './names';
import { range } from './numbers';

export const getContainerName = (node: CommonNode) =>
  `polar-n${node.networkId}-${node.name}`;

export const groupNodes = (network: Network) => {
  const { bitcoin, lightning } = network.nodes;
  return {
    bitcoind: bitcoin.filter(n => n.implementation === 'bitcoind') as BitcoinNode[],
    lnd: lightning.filter(n => n.implementation === 'LND') as LndNode[],
    lightningd: lightning.filter(
      n => n.implementation === 'c-lightning',
    ) as LightningdNode[],
    eclair: lightning.filter(n => n.implementation === 'eclair'),
  };
};

// long path games
const getLndFilePaths = (name: string, network: Network) => {
  // returns /volumes/lnd/lnd-1
  const lndDataPath = (name: string) => join(network.path, 'volumes', 'lnd', name);
  // returns /volumes/lnd/lnd-1/tls.cert
  const lndCertPath = (name: string) => join(lndDataPath(name), 'tls.cert');
  // returns /data/chain/bitcoin/regtest
  const macaroonPath = join('data', 'chain', 'bitcoin', 'regtest');
  // returns /volumes/lnd/lnd-1/data/chain/bitcoin/regtest/admin.amacaroon
  const lndMacaroonPath = (name: string, macaroon: string) =>
    join(lndDataPath(name), macaroonPath, `${macaroon}.macaroon`);

  return {
    tlsCert: lndCertPath(name),
    adminMacaroon: lndMacaroonPath(name, 'admin'),
    readonlyMacaroon: lndMacaroonPath(name, 'readonly'),
  };
};

export const createLndNetworkNode = (
  network: Network,
  version: LndVersion,
  status: Status,
): LndNode => {
  const { bitcoin, lightning } = network.nodes;
  const id = lightning.length ? Math.max(...lightning.map(n => n.id)) + 1 : 0;
  const name = getName(id);
  return {
    id,
    networkId: network.id,
    name: name,
    type: 'lightning',
    implementation: 'LND',
    version,
    status,
    backendName: bitcoin[0].name,
    paths: getLndFilePaths(name, network),
    ports: {
      rest: BasePorts.lnd.rest + id,
      grpc: BasePorts.lnd.grpc + id,
    },
  };
};

export const createLightningdNetworkNode = (
  network: Network,
  version: LightningdVersion,
  status: Status,
): LightningdNode => {
  const { bitcoin, lightning } = network.nodes;
  const id = lightning.length ? Math.max(...lightning.map(n => n.id)) + 1 : 0;
  const name = getName(id);
  const nodePath = join(network.path, 'volumes', 'clightning', name);
  return {
    id,
    networkId: network.id,
    name: name,
    type: 'lightning',
    implementation: 'c-lightning',
    version,
    status,
    backendName: bitcoin[0].name,
    paths: {
      macaroon: join(nodePath, 'rest-api', 'access.macaroon'),
    },
    ports: {
      rest: BasePorts.lightningd.rest + id,
    },
  };
};

export const createBitcoindNetworkNode = (
  network: Network,
  status: Status,
): BitcoinNode => {
  const index = network.nodes.bitcoin.length;
  const name = `backend${index ? index + 1 : ''}`;
  return {
    id: index,
    networkId: network.id,
    name: name,
    type: 'bitcoin',
    implementation: 'bitcoind',
    version: '0.18.1',
    status,
    ports: { rpc: BasePorts.bitcoind.rest + index },
  };
};

export const createNetwork = (config: {
  id: number;
  name: string;
  lndNodes: number;
  lightningdNodes: number;
  bitcoindNodes: number;
  status?: Status;
}): Network => {
  const { id, name, lndNodes, lightningdNodes, bitcoindNodes } = config;
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

  range(bitcoindNodes).forEach(() => {
    network.nodes.bitcoin.push(createBitcoindNetworkNode(network, status));
  });

  range(lndNodes).forEach(() => {
    network.nodes.lightning.push(
      createLndNetworkNode(network, LndVersion.latest, status),
    );
  });

  range(lightningdNodes).forEach(() => {
    network.nodes.lightning.push(
      createLightningdNetworkNode(network, LightningdVersion.latest, status),
    );
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
  const neededImages = [...bitcoin, ...lightning].map(
    n => `${n.implementation.toLocaleLowerCase().replace(/-/g, '')}:${n.version}`,
  );
  // exclude images already pulled
  const missing = neededImages.filter(i => !pulled.includes(i));
  // filter out duplicates
  return missing.filter((image, index) => missing.indexOf(image) === index);
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
    const existingPorts = bitcoin.map(n => n.ports.rpc);
    const openPorts = await getOpenPortRange(existingPorts);
    if (openPorts.join() !== existingPorts.join()) {
      openPorts.forEach((port, index) => {
        ports[bitcoin[index].name] = { rpc: port };
      });
    }
  }

  let { lnd, lightningd } = groupNodes(network);

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
  }

  lightningd = lightningd.filter(n => n.status !== Status.Started);
  if (lightningd.length) {
    const existingPorts = lightningd.map(n => n.ports.rest);
    const openPorts = await getOpenPortRange(existingPorts);
    if (openPorts.join() !== existingPorts.join()) {
      openPorts.forEach((port, index) => {
        ports[lightningd[index].name] = { rpc: port };
      });
    }
  }

  // return undefined if no ports where updated
  return Object.keys(ports).length > 0 ? ports : undefined;
};
