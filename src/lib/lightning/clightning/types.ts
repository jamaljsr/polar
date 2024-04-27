/**
 * Core Lightning API Response Types
 * https://docs.corelightning.org/reference/get_list_methods_resource
 */

export interface GetInfoResponse {
  id: string;
  alias: string;
  color: string;
  numPeers: number;
  numPendingChannels: number;
  numActiveChannels: number;
  numInactiveChannels: number;
  address: string[];
  binding: {
    type: string;
    address: string;
    port: number;
  }[];
  version: string;
  blockheight: number;
  network: string;
  msatoshiFeesCollected: number;
  feesCollectedMsat: string;
  warningBitcoindSync: string;
  warningLightningdSync: string;
}

export interface ListFundsResponse {
  outputs: {
    status: 'confirmed' | 'unconfirmed';
    amountMsat: number;
  }[];
}

export interface NewAddrResponse {
  bech32: string;
}

/**
 * Source: https://github.com/ElementsProject/lightning/blob/master/lightningd/channel_state.h
 */
export enum ChannelState {
  /* In channeld, still waiting for lockin. */
  CHANNELD_AWAITING_LOCKIN = 'CHANNELD_AWAITING_LOCKIN',
  /* Normal operating state. */
  CHANNELD_NORMAL = 'CHANNELD_NORMAL',
  /* We are closing. pending HTLC resolution. */
  CHANNELD_SHUTTING_DOWN = 'CHANNELD_SHUTTING_DOWN',
  /* Exchanging signatures on closing tx. */
  CLOSINGD_SIGEXCHANGE = 'CLOSINGD_SIGEXCHANGE',
  /* Waiting for onchain event. */
  CLOSINGD_COMPLETE = 'CLOSINGD_COMPLETE',
  /* Waiting for unilateral close to hit blockchain. */
  AWAITING_UNILATERAL = 'AWAITING_UNILATERAL',
  /* We've seen the funding spent. we're waiting for onchaind. */
  FUNDING_SPEND_SEEN = 'FUNDING_SPEND_SEEN',
  /* On chain */
  ONCHAIN = 'ONCHAIN',
  /* Final state after we have fully settled on-chain */
  CLOSED = 'CLOSED',
}

export interface ListPeerChannelsResponse {
  channels: {
    state: ChannelState;
    opener: 'local' | 'remote';
    shortChannelId: string;
    channelId: string;
    peerId: string;
    toUsMsat: number;
    totalMsat: number;
    private: boolean;
    fundingTxid: string;
    fundingOutnum: number;
  }[];
}

export interface ListPeersResponse {
  peers: Peer[];
}

export interface Peer {
  id: string;
  alias: string;
  connected: boolean;
  netaddr: string[];
  localfeatures: string;
  globalfeatures: string;
}

export interface OpenChannelRequest {
  id: string;
  amount: string;
  feerate?: number | string;
  announce?: boolean;
}

export interface OpenChannelResponse {
  tx: string;
  txid: string;
  channelId: string;
  outnum: number;
}

export interface CloseChannelResponse {
  tx: string;
  txid: string;
  type: string;
}

export interface InvoiceRequest {
  amount_msat: number | 'any';
  label: string;
  description: string;
  expiry?: number | string;
}

export interface InvoiceResponse {
  paymentHash: string;
  expiresAt: string;
  bolt11: string;
  warningCapacity?: string;
}

export interface PayRequest {
  bolt11: string;
  amount_msat?: number;
}

export interface PayResponse {
  paymentPreimage: string;
  amountMsat: number;
  destination: string;
  status: string;
  paymentHash: string;
  parts: number;
}

export interface ChannelStateChangeEvent {
  peer_id: string;
  channel_id: string;
  short_channel_id: string;
  timestamp: string;
  old_state: ChannelState;
  new_state: ChannelState;
  cause: string;
  message: string;
}
