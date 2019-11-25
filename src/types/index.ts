import { IChart } from '@mrblenny/react-flow-chart';
import { ChainInfo, WalletInfo } from 'bitcoin-core';
import { BitcoinNode, CommonNode, LightningNode, Status } from 'shared/types';
import { IpcSender } from 'lib/ipc/ipcService';
import {
  LightningNodeAddress,
  LightningNodeBalances,
  LightningNodeChannel,
  LightningNodeChannelPoint,
  LightningNodeInfo,
} from 'lib/lightning/types';

export interface LocaleConfig {
  fallbackLng: string;
  languages: {
    [key: string]: string;
  };
}

export interface Network {
  id: number;
  name: string;
  status: Status;
  path: string;
  nodes: {
    bitcoin: BitcoinNode[];
    lightning: LightningNode[];
  };
}

export interface DockerVersions {
  docker: string;
  compose: string;
}

export interface DockerLibrary {
  getVersions: (throwOnError?: boolean) => Promise<DockerVersions>;
  getImages: () => Promise<string[]>;
  saveComposeFile: (network: Network) => Promise<void>;
  start: (network: Network) => Promise<void>;
  stop: (network: Network) => Promise<void>;
  removeNode: (network: Network, node: CommonNode) => Promise<void>;
  saveNetworks: (networks: NetworksFile) => Promise<void>;
  loadNetworks: () => Promise<NetworksFile>;
}

export interface BitcoindLibrary {
  waitUntilOnline: (port?: number) => Promise<void>;
  getBlockchainInfo: (port?: number) => Promise<ChainInfo>;
  getWalletInfo: (port?: number) => Promise<WalletInfo>;
  mine: (numBlocks: number, port?: number) => Promise<string[]>;
  sendFunds: (node: BitcoinNode, addr: string, amount: number) => Promise<string>;
}

export interface LightningService {
  waitUntilOnline: (node: LightningNode) => Promise<void>;
  getInfo: (node: LightningNode) => Promise<LightningNodeInfo>;
  getBalances: (node: LightningNode) => Promise<LightningNodeBalances>;
  getNewAddress: (node: LightningNode) => Promise<LightningNodeAddress>;
  getChannels: (node: LightningNode) => Promise<LightningNodeChannel[]>;
  openChannel: (
    from: LightningNode,
    toRpcUrl: string,
    amount: string,
  ) => Promise<LightningNodeChannelPoint>;
  closeChannel: (node: LightningNode, channelPoint: string) => Promise<any>;
}

export interface LightningFactoryInjection {
  getService: (node: LightningNode) => LightningService;
}

export interface StoreInjections {
  ipc: IpcSender;
  dockerService: DockerLibrary;
  bitcoindService: BitcoindLibrary;
  lightningFactory: LightningFactoryInjection;
}

export interface NetworksFile {
  networks: Network[];
  charts: Record<number, IChart>;
}
