import { IChart } from '@mrblenny/react-flow-chart';
import * as LND from '@radar/lnrpc';
import { ChainInfo, WalletInfo } from 'bitcoin-core';
import {
  BitcoinNode,
  CLightningNode,
  CommonNode,
  LightningNode,
  LndNode,
  Status,
} from 'shared/types';
import * as CLN from 'lib/clightning/clightningTypes';
import { IpcSender } from 'lib/ipc/ipcService';

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

export interface LndLibrary {
  waitUntilOnline: (node: LndNode) => Promise<void>;
  getInfo: (node: LndNode) => Promise<LND.GetInfoResponse>;
  getWalletBalance: (node: LndNode) => Promise<LND.WalletBalanceResponse>;
  getNewAddress: (node: LndNode) => Promise<LND.NewAddressResponse>;
  openChannel: (from: LndNode, to: LndNode, amount: string) => Promise<LND.ChannelPoint>;
  closeChannel: (node: LndNode, channelPoint: string) => Promise<any>;
  listChannels: (node: LndNode) => Promise<LND.ListChannelsResponse>;
  pendingChannels: (node: LndNode) => Promise<LND.PendingChannelsResponse>;
  onNodesDeleted: (nodes: LndNode[]) => Promise<void>;
}

export interface CLightningLibrary {
  waitUntilOnline: (node: CLightningNode) => Promise<void>;
  getInfo: (node: CLightningNode) => Promise<CLN.GetInfoResponse>;
}

export interface StoreInjections {
  ipc: IpcSender;
  dockerService: DockerLibrary;
  bitcoindService: BitcoindLibrary;
  lndService: LndLibrary;
  clightningService: CLightningLibrary;
}

export interface NetworksFile {
  networks: Network[];
  charts: Record<number, IChart>;
}
