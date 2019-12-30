import { IChart } from '@mrblenny/react-flow-chart';
import { ChainInfo, WalletInfo } from 'bitcoin-core';
import {
  BitcoinNode,
  CommonNode,
  LightningNode,
  NodeImplementation,
  Status,
} from 'shared/types';
import { IpcSender } from 'lib/ipc/ipcService';
import * as PLN from 'lib/lightning/types';
import { PolarPlatform } from 'utils/system';

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

export interface AppSettings {
  lang: string;
  showAllNodeVersions: boolean;
}

export interface SettingsInjection {
  save: (settings: AppSettings) => Promise<void>;
  load: () => Promise<AppSettings | undefined>;
}

export interface DockerVersions {
  docker: string;
  compose: string;
}

export interface DockerConfig {
  name: string;
  logo: string;
  platforms: PolarPlatform[];
  volumeDirName: string;
  dataDir?: string;
  apiDir?: string;
}

export interface DockerRepoImage {
  latest: string;
  versions: string[];
  /**
   * a mapping of the image version to the highest compatible bitcoind version
   */
  compatibility?: Record<string, string>;
}

export interface DockerRepoState {
  /**
   * the version of the repo state file. Used to quickly identify updates
   */
  version: number;
  images: Record<NodeImplementation, DockerRepoImage>;
}

export interface DockerRepoUpdates {
  state: DockerRepoState;
  updates?: Record<NodeImplementation, string[]>;
}

export interface DockerLibrary {
  getVersions: (throwOnError?: boolean) => Promise<DockerVersions>;
  getImages: () => Promise<string[]>;
  saveComposeFile: (network: Network) => Promise<void>;
  start: (network: Network) => Promise<void>;
  stop: (network: Network) => Promise<void>;
  startNode: (network: Network, node: CommonNode) => Promise<void>;
  stopNode: (network: Network, node: CommonNode) => Promise<void>;
  removeNode: (network: Network, node: CommonNode) => Promise<void>;
  saveNetworks: (networks: NetworksFile) => Promise<void>;
  loadNetworks: () => Promise<NetworksFile>;
}

export interface RepoServiceInjection {
  save: (settings: DockerRepoState) => Promise<void>;
  load: () => Promise<DockerRepoState | undefined>;
  checkForUpdates: (currState: DockerRepoState) => Promise<DockerRepoUpdates>;
}

export interface BitcoindLibrary {
  waitUntilOnline: (node: BitcoinNode) => Promise<void>;
  getBlockchainInfo: (node: BitcoinNode) => Promise<ChainInfo>;
  getWalletInfo: (node: BitcoinNode) => Promise<WalletInfo>;
  connectPeers: (node: BitcoinNode) => Promise<void>;
  mine: (numBlocks: number, node: BitcoinNode) => Promise<string[]>;
  sendFunds: (node: BitcoinNode, addr: string, amount: number) => Promise<string>;
}

export interface LightningService {
  waitUntilOnline: (node: LightningNode) => Promise<void>;
  getInfo: (node: LightningNode) => Promise<PLN.LightningNodeInfo>;
  getBalances: (node: LightningNode) => Promise<PLN.LightningNodeBalances>;
  getNewAddress: (node: LightningNode) => Promise<PLN.LightningNodeAddress>;
  getChannels: (node: LightningNode) => Promise<PLN.LightningNodeChannel[]>;
  getPeers: (node: LightningNode) => Promise<PLN.LightningNodePeer[]>;
  connectPeers: (node: LightningNode, rpcUrls: string[]) => Promise<void>;
  openChannel: (
    from: LightningNode,
    toRpcUrl: string,
    amount: string,
  ) => Promise<PLN.LightningNodeChannelPoint>;
  closeChannel: (node: LightningNode, channelPoint: string) => Promise<any>;
  createInvoice: (node: LightningNode, amount: number, memo?: string) => Promise<string>;
  payInvoice: (
    node: LightningNode,
    invoice: string,
    amount?: number,
  ) => Promise<PLN.LightningNodePayReceipt>;
}

export interface LightningFactoryInjection {
  getService: (node: LightningNode) => LightningService;
}

export interface StoreInjections {
  ipc: IpcSender;
  settingsService: SettingsInjection;
  dockerService: DockerLibrary;
  repoService: RepoServiceInjection;
  bitcoindService: BitcoindLibrary;
  lightningFactory: LightningFactoryInjection;
}

export interface NetworksFile {
  networks: Network[];
  charts: Record<number, IChart>;
}
