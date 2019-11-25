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
  status:
    | 'Open'
    | 'Opening'
    | 'Closing'
    | 'Force Closing'
    | 'Waiting to Close'
    | 'Closed';
}

export interface LightningNodeChannelPoint {
  txid: string;
  index: number;
}
