import { IChart } from '@mrblenny/react-flow-chart';
import { GetInfoResponse } from '@radar/lnrpc';
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
  id: number;
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
  design?: IChart;
  nodes: {
    bitcoin: BitcoinNode[];
    lightning: LndNode[];
  };
}

export interface DockerLibrary {
  create: (network: Network) => Promise<void>;
  start: (network: Network) => Promise<void>;
  stop: (network: Network) => Promise<void>;
  save: (networks: Network[]) => Promise<void>;
  load: () => Promise<Network[]>;
}

export interface BitcoindLibrary {
  getBlockchainInfo: (port?: number) => Promise<ChainInfo>;
  getWalletInfo: (port?: number) => Promise<WalletInfo>;
  mine: (numBlocks: number, port?: number) => Promise<string[]>;
}

export interface LndLibrary {
  initialize: (node: LndNode) => Promise<any>;
  getInfo: (node: LndNode) => Promise<GetInfoResponse>;
}

export interface StoreInjections {
  dockerService: DockerLibrary;
  bitcoindService: BitcoindLibrary;
  lndService: LndLibrary;
}
