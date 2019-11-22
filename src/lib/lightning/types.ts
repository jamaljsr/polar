import { LightningNode } from 'shared/types';

export interface LightningNodeInfo {
  pubkey: string;
  alias: string;
  syncedToChain: boolean;
  numPendingChannels: number;
  numActiveChannels: number;
  numInactiveChannels: number;
  rpcUrl: string;
}

export interface LightningNodeBalances {
  total: string;
  confirmed: string;
  unconfirmed: string;
}

export interface LightningService {
  waitUntilOnline: (node: LightningNode) => Promise<void>;
  getInfo: (node: LightningNode) => Promise<LightningNodeInfo>;
  getBalances: (node: LightningNode) => Promise<LightningNodeBalances>;
  // getNewAddress: (node: LightningNode) => Promise<LND.NewAddressResponse>;
  // openChannel: (from: LightningNode, to: LightningNode, amount: string) => Promise<LND.ChannelPoint>;
  // closeChannel: (node: LightningNode, channelPoint: string) => Promise<any>;
  // listChannels: (node: LightningNode) => Promise<LND.ListChannelsResponse>;
  // pendingChannels: (node: LightningNode) => Promise<LND.PendingChannelsResponse>;
  // onNodesDeleted: (nodes: LightningNode[]) => Promise<void>;
}
