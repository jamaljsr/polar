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
}
