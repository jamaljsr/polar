export interface GetInfoResponse {
  version: string;
  nodeId: string;
  alias: string;
  color: string;
  features: string;
  chainHash: string;
  blockHeight: number;
  publicAddresses: string[];
}

/**
 * Source: https://github.com/ACINQ/eclair/blob/v0.3.3/eclair-core/src/main/scala/fr/acinq/eclair/channel/ChannelTypes.scala#L55
 */
export enum ChannelState {
  WAIT_FOR_INIT_INTERNAL = 'WAIT_FOR_INIT_INTERNAL',
  WAIT_FOR_OPEN_CHANNEL = 'WAIT_FOR_OPEN_CHANNEL',
  WAIT_FOR_ACCEPT_CHANNEL = 'WAIT_FOR_ACCEPT_CHANNEL',
  WAIT_FOR_FUNDING_INTERNAL = 'WAIT_FOR_FUNDING_INTERNAL',
  WAIT_FOR_FUNDING_CREATED = 'WAIT_FOR_FUNDING_CREATED',
  WAIT_FOR_FUNDING_SIGNED = 'WAIT_FOR_FUNDING_SIGNED',
  WAIT_FOR_FUNDING_CONFIRMED = 'WAIT_FOR_FUNDING_CONFIRMED',
  WAIT_FOR_FUNDING_LOCKED = 'WAIT_FOR_FUNDING_LOCKED',
  NORMAL = 'NORMAL',
  SHUTDOWN = 'SHUTDOWN',
  NEGOTIATING = 'NEGOTIATING',
  CLOSING = 'CLOSING',
  CLOSED = 'CLOSED',
  OFFLINE = 'OFFLINE',
  SYNCING = 'SYNCING',
  WAIT_FOR_REMOTE_PUBLISH_FUTURE_COMMITMENT = 'WAIT_FOR_REMOTE_PUBLISH_FUTURE_COMMITMENT',
  ERR_FUNDING_LOST = 'ERR_FUNDING_LOST',
  ERR_INFORMATION_LEAK = 'ERR_INFORMATION_LEAK',
}

export interface ChannelResponse {
  nodeId: string;
  channelId: string;
  state: ChannelState;
  // there's a ton of data under this key that isn't needed, so just
  // use any to avoid having to maintain the structure for each release
  data: any;
}

export interface PeerResponse {
  nodeId: string;
  state: 'CONNECTED' | 'DISCONNECTED';
  channels: number;
}

export interface OpenChannelRequest {
  nodeId: string;
  fundingSatoshis: number;
  pushMsat?: number;
  fundingFeerateSatByte?: number;
  channelFlags?: number;
  openTimeoutSeconds?: number;
}

export interface CloseChannelRequest {
  channelId: string;
  shortChannelId?: string;
  scriptPubKey?: string;
}

export interface CreateInvoiceRequest {
  description: string;
  amountMsat?: number;
  expireIn?: number;
  fallbackAddress?: string;
  paymentPreimage?: string;
}

export interface CreateInvoiceResponse {
  prefix: string;
  timestamp: number;
  nodeId: string;
  serialized: string;
  description: string;
  paymentHash: string;
  expiry: number;
  amount: number;
}

export interface PayInvoiceRequest {
  invoice: string;
  amountMsat?: number;
  maxAttempts?: number;
  feeThresholdSat?: number;
  maxFeePct?: number;
  externalId?: string;
}

export interface GetSentInfoRequest {
  paymentHash?: string;
  id?: string;
}

export interface GetSentInfoResponse {
  id: string;
  parentId: string;
  externalId: string;
  paymentHash: string;
  paymentType: string;
  amount: number;
  recipientAmount: number;
  recipientNodeId: string;
  createdAt: number;
  paymentRequest: {
    prefix: string;
    timestamp: number;
    nodeId: string;
    serialized: string;
    description: string;
    paymentHash: string;
    expiry: number;
    amount: number;
  };
  status: {
    type: string;
    paymentPreimage: string;
    feesPaid: number;
    route: [
      {
        nodeId: string;
        nextNodeId: string;
        shortChannelId: string;
      },
    ];
    failures: [
      {
        failureType: {
          name: string;
        };
        failureMessage: string;
        failedRoute: [
          {
            nodeId: string;
            nextNodeId: string;
            shortChannelId: string;
          },
        ];
      },
    ];
    completedAt: number;
  };
}
