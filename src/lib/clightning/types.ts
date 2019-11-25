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

export interface GetBalanceResponse {
  totalBalance: number;
  confBalance: number;
  unconfBalance: number;
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

export interface GetChannelsResponse {
  alias: string;
  channelId: string;
  connected: boolean;
  fundingTxid: string;
  id: string;
  msatoshiToUs: number;
  msatoshiTotal: number;
  ourChannelReserveSatoshis: number;
  private: boolean;
  shortChannelId: string;
  spendableMsatoshi: number;
  state: ChannelState;
  theirChannelReserveSatoshis: number;
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
  satoshis: string;
}

export interface OpenChannelResponse {
  tx: string;
  txid: string;
  channelId: string;
}

export interface CloseChannelResponse {
  tx: string;
  txid: string;
  type: string;
}
