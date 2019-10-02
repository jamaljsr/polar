import { IChart } from '@mrblenny/react-flow-chart';
import * as RPC from '@radar/lnrpc';
import { ChainInfo, WalletInfo } from 'bitcoin-core';

export interface LocalConfig {
  fallbackLng: string;
  languages: {
    [key: string]: string;
  };
}

export enum Status {
  Starting,
  Started,
  Stopping,
  Stopped,
  Error,
}

export interface CommonNode {
  // TODO: change id to a uuid
  id: number;
  networkId: number;
  name: string;
  type: 'bitcoin' | 'lightning';
  version: string;
  status: Status;
}

export interface BitcoinNode extends CommonNode {
  type: 'bitcoin';
  implementation: 'bitcoind' | 'btcd';
  ports: {
    rpc: number;
  };
}

export interface LightningNode extends CommonNode {
  type: 'lightning';
  implementation: 'LND' | 'c-lightning' | 'eclair';
  backendName: string;
}

export interface LndNode extends LightningNode {
  tlsPath: string;
  macaroonPath: string;
  ports: {
    rest: number;
    grpc: number;
  };
}

export interface Network {
  id: number;
  name: string;
  status: Status;
  path: string;
  nodes: {
    bitcoin: BitcoinNode[];
    lightning: LndNode[];
  };
}

export interface DockerLibrary {
  create: (network: Network) => Promise<void>;
  start: (network: Network) => Promise<void>;
  stop: (network: Network) => Promise<void>;
  save: (networks: NetworksFile) => Promise<void>;
  load: () => Promise<NetworksFile>;
}

export interface BitcoindLibrary {
  waitUntilOnline: (port?: number) => Promise<boolean>;
  getBlockchainInfo: (port?: number) => Promise<ChainInfo>;
  getWalletInfo: (port?: number) => Promise<WalletInfo>;
  mine: (numBlocks: number, port?: number) => Promise<string[]>;
  sendFunds: (node: BitcoinNode, addr: string, amount: number) => Promise<string>;
}

export interface LndLibrary {
  waitUntilOnline(node: LndNode): Promise<boolean>;
  getInfo: (node: LndNode) => Promise<RPC.GetInfoResponse>;
  getWalletBalance: (node: LndNode) => Promise<RPC.WalletBalanceResponse>;
  getNewAddress: (node: LndNode) => Promise<RPC.NewAddressResponse>;
}

export interface StoreInjections {
  dockerService: DockerLibrary;
  bitcoindService: BitcoindLibrary;
  lndService: LndLibrary;
}

export interface NetworksFile {
  networks: Network[];
  charts: Record<number, IChart>;
}
