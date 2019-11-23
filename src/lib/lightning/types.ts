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

export interface LightningNodeAddress {
  address: string;
}

export interface LightningNodeChannel {
  pending: boolean;
  uniqueId: string;
  channelPoint: string;
  pubkey: string;
  capacity: string;
  localBalance: string;
  remoteBalance: string;
  status: 'Open' | 'Opening' | 'Closing' | 'Force Closing' | 'Waiting to Close';
}

export interface LightningNodeChannelPoint {
  txid: string;
  index: number;
}

export interface LightningService {
  waitUntilOnline: (node: LightningNode) => Promise<void>;
  getInfo: (node: LightningNode) => Promise<LightningNodeInfo>;
  getBalances: (node: LightningNode) => Promise<LightningNodeBalances>;
  getNewAddress: (node: LightningNode) => Promise<LightningNodeAddress>;
  getChannels: (node: LightningNode) => Promise<LightningNodeChannel[]>;
  openChannel: (
    from: LightningNode,
    to: LightningNode,
    amount: string,
  ) => Promise<LightningNodeChannelPoint>;
  closeChannel: (node: LightningNode, channelPoint: string) => Promise<any>;
  // listChannels: (node: LightningNode) => Promise<LND.ListChannelsResponse>;
  // pendingChannels: (node: LightningNode) => Promise<LND.PendingChannelsResponse>;
  // onNodesDeleted: (nodes: LightningNode[]) => Promise<void>;
}
