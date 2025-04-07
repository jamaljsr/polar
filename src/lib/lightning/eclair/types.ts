import WebSocket from 'ws';

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

/**
 * 0 is private, 1 is public
 */
type ChannelFlags = 0 | 1;

/**
 * This interface is incomplete, it only has the data we use.
 * See docs for what the actual channel data would look like here:
 * https://acinq.github.io/eclair/#channel
 */
interface ChannelData {
  // ChannelData interface has some repeated fields to be compatible with v0.9.0, 0.8.0 and 0.7.0 versions
  commitments: {
    params: {
      localParams: {
        isInitiator: boolean;
        // isInitiator was renamed to isChannelOpener in v0.11.0
        isChannelOpener: boolean;
      };
      channelFlags: {
        announceChannel: boolean;
      };
    };
    active: [
      {
        fundingTx: {
          amountSatoshis: number;
        };
        localCommit: {
          spec: {
            toLocal: number;
            toRemote: number;
          };
        };
      },
    ];
    localParams: {
      // The isFunder field was renamed to isInitiator in v0.8.0+
      isFunder: boolean;
      isInitiator: boolean;
    };
    channelFlags: {
      announceChannel: boolean;
    };
    localCommit: {
      spec: {
        toLocal: number;
        toRemote: number;
      };
    };
    commitInput: {
      amountSatoshis: number;
    };
  };
}

export interface ChannelResponse {
  nodeId: string;
  channelId: string;
  state: ChannelState;
  data: ChannelData;
}

export interface PeerResponse {
  nodeId: string;
  state: 'CONNECTED' | 'DISCONNECTED';
  channels: number;
  address?: string;
}

export interface OpenChannelRequest {
  nodeId: string;
  fundingSatoshis: number;
  pushMsat?: number;
  fundingFeerateSatByte?: number;
  fundingFeeBudgetSatoshis: number;
  channelFlags?: ChannelFlags;
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

interface InvoicePayReq {
  prefix: string;
  timestamp: number;
  nodeId: string;
  serialized: string;
  description: string;
  paymentHash: string;
  expiry: number;
  amount: number;
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
  // The paymentRequest field was renamed to invoice in v0.8.0. We use both
  // to maintain compatibility with older versions.
  paymentRequest: InvoicePayReq;
  invoice: InvoicePayReq;
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

export interface ConfigOptions {
  // e.g. '127.0.0.1:8080'
  url: string;
  headers: {
    // E.g. 'Basic OmVjbGFpcnB3'
    Authorization: string;
  };
}

export interface EclairWebSocket extends WebSocket {
  on(
    event: string | symbol,
    listener: (this: EclairWebSocket, ...args: any[]) => void,
  ): this;
}
