import { join } from 'path';
import { BitcoinNode, LndNode, Network, Status } from 'types';
import { networksPath } from './config';
import { range } from './numbers';

// long path games
const getFilePaths = (name: string, network: Network) => {
  // add polar prefix to the name. ex: polar-n1-lnd-1
  const prefix = (name: string) => `polar-n${network.id}-${name}`;
  // returns /volumes/lnd/polar-n1-lnd-1
  const lndDataPath = (name: string) =>
    join(network.path, 'volumes', 'lnd', prefix(name));
  // returns /volumes/lnd/polar-n1-lnd-1/tls.cert
  const lndCertPath = (name: string) => join(lndDataPath(name), 'tls.cert');
  // returns /data/chain/bitcoin/regtest
  const macaroonPath = join('data', 'chain', 'bitcoin', 'regtest');
  // returns /volumes/lnd/polar-n1-lnd-1/data/chain/bitcoin/regtest/admin.amacaroon
  const lndMacaroonPath = (name: string, macaroon: string) =>
    join(lndDataPath(name), macaroonPath, `${macaroon}.macaroon`);

  return {
    tlsCert: lndCertPath(name),
    adminMacaroon: lndMacaroonPath(name, 'admin'),
    readonlyMacaroon: lndMacaroonPath(name, 'readonly'),
  };
};

export const createLndNode = (network: Network, status: Status): LndNode => {
  const index = network.nodes.lightning.length;
  const name = `lnd-${index + 1}`;
  return {
    id: index,
    networkId: network.id,
    name: name,
    type: 'lightning',
    implementation: 'LND',
    version: '0.7.1-beta',
    status,
    backendName: network.nodes.bitcoin[0].name,
    paths: getFilePaths(name, network),
    ports: {
      rest: 8081 + index,
      grpc: 10001 + index,
    },
  };
};

export const createBitcoindNode = (network: Network, status: Status): BitcoinNode => {
  const index = network.nodes.bitcoin.length;
  const name = `bitcoind-${index + 1}`;
  return {
    id: index,
    networkId: network.id,
    name: name,
    type: 'bitcoin',
    implementation: 'bitcoind',
    version: '0.18.1',
    status,
    ports: { rpc: 18443 },
  };
};

export const createNetwork = (config: {
  id: number;
  name: string;
  lndNodes: number;
  bitcoindNodes: number;
  status?: Status;
}): Network => {
  const { id, name, lndNodes, bitcoindNodes } = config;
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

  range(bitcoindNodes).map(() => {
    network.nodes.bitcoin.push(createBitcoindNode(network, status));
  });

  range(lndNodes).forEach(() => {
    network.nodes.lightning.push(createLndNode(network, status));
  });

  return network;
};
