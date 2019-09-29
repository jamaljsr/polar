import { join } from 'path';
import { BitcoinNode, LndNode, Network, Status } from 'types';
import { networksPath } from './config';
import { range } from './numbers';

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

  network.nodes.bitcoin = range(bitcoindNodes).map<BitcoinNode>((v, i) => ({
    id: i,
    name: `bitcoind-${i + 1}`,
    type: 'bitcoin',
    implementation: 'bitcoind',
    version: '0.18.1',
    status,
    ports: { rpc: 18443 },
  }));

  // long path games
  const prefix = (name: string) => `polar-n${network.id}-${name}`;
  const lndDataPath = (name: string) =>
    join(network.path, 'volumes', 'lnd', prefix(name));
  const lndCertPath = (name: string) => join(lndDataPath(name), 'tls.cert');
  const macaroonPath = join('data', 'chain', 'bitcoin', 'regtest', 'admin.macaroon');
  const lndMacaroonPath = (name: string) => join(lndDataPath(name), macaroonPath);

  network.nodes.lightning = range(lndNodes)
    .map((v, i) => `lnd-${i + 1}`)
    .map<LndNode>((name, i) => ({
      id: i,
      name: name,
      type: 'lightning',
      implementation: 'LND',
      version: '0.7.1-beta',
      status,
      backendName: network.nodes.bitcoin[0].name,
      tlsPath: lndCertPath(name),
      macaroonPath: lndMacaroonPath(name),
      ports: {
        rest: 8081 + i,
        grpc: 10001 + i,
      },
    }));

  return network;
};
