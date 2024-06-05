/*
 * Shared types to normalize interfaces between the different
 * lightning implementations
 */

export interface LightningNodeInfo {
  pubkey: string;
  alias: string;
  syncedToChain: boolean;
  blockHeight: number;
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

export interface LightningNodeChannelAsset {
  id: string;
  name: string;
  capacity: string;
  localBalance: string;
  remoteBalance: string;
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
    | 'Closed'
    | 'Error';
  isPrivate: boolean;
  assets?: LightningNodeChannelAsset[];
}

export interface LightningNodeChannelPoint {
  txid: string;
  index: number;
}

export interface LightningNodePeer {
  pubkey: string;
  address: string;
}

export interface LightningNodePayReceipt {
  preimage: string;
  amount: number;
  destination: string;
}

export interface LightningNodePaymentRequest {
  paymentHash: string;
  amountMsat: string;
  expiry: string;
}

export interface LightningNodeChannelEvent {
  type: 'Open' | 'Pending' | 'Closed' | 'Unknown';
}

export interface CustomRecords extends Record<number, string> {}
