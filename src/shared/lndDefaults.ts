import * as LND from '@radar/lnrpc';
import { ipcChannels } from './';

const mapArray = <T>(arr: T[], func: (value: T) => T) => (arr || []).map(func);

export const defaultLndInfo = (
  value: Partial<LND.GetInfoResponse>,
): LND.GetInfoResponse => ({
  identityPubkey: '',
  alias: '',
  numPendingChannels: 0,
  numActiveChannels: 0,
  numPeers: 0,
  blockHeight: 0,
  blockHash: '',
  syncedToChain: false,
  syncedToGraph: false,
  testnet: false,
  chains: [],
  uris: [],
  bestHeaderTimestamp: '',
  version: '',
  numInactiveChannels: 0,
  color: '',
  features: [],
  commitHash: '',
  ...value,
});

export const defaultLndWalletBalance = (
  value: Partial<LND.WalletBalanceResponse>,
): LND.WalletBalanceResponse => ({
  confirmedBalance: '0',
  totalBalance: '0',
  unconfirmedBalance: '0',
  ...value,
});

export const defaultLndListPeers = (
  value: Partial<LND.ListPeersResponse>,
): LND.ListPeersResponse => ({
  peers: [],
  ...value,
});

export const defaultLndChannelPoint = (
  value: Partial<LND.ChannelPoint>,
): LND.ChannelPoint => ({
  fundingTxidBytes: '',
  fundingTxidStr: '',
  outputIndex: 0,
  ...value,
});

export const defaultLndChannel = (value: Partial<LND.Channel>): LND.Channel => ({
  active: false,
  remotePubkey: '',
  channelPoint: '',
  chanId: '',
  capacity: '0',
  localBalance: '0',
  remoteBalance: '0',
  commitFee: '0',
  commitWeight: '0',
  feePerKw: '0',
  unsettledBalance: '',
  totalSatoshisSent: '0',
  totalSatoshisReceived: '0',
  numUpdates: '0',
  pendingHtlcs: [],
  csvDelay: 0,
  private: false,
  initiator: false,
  chanStatusFlags: '',
  localChanReserveSat: '0',
  remoteChanReserveSat: '0',
  staticRemoteKey: false,
  lifetime: 0,
  uptime: 0,
  closeAddress: '',
  commitmentType: 1, // LND.CommitmentType.STATIC_REMOTE_KEY
  pushAmountSat: 0,
  thawHeight: 0,
  ...value,
});

export const defaultLndListChannels = (
  value: Partial<LND.ListChannelsResponse>,
): LND.ListChannelsResponse => ({
  channels: mapArray(value.channels || [], defaultLndChannel),
});

export const defaultLndPendingChannel = (
  value: Partial<LND.PendingChannel>,
): LND.PendingChannel => ({
  remoteNodePub: '',
  channelPoint: '',
  capacity: '0',
  localBalance: '0',
  remoteBalance: '0',
  localChanReserveSat: '0',
  remoteChanReserveSat: '0',
  initiator: 1, // LND.Initiator.INITIATOR_LOCAL
  commitmentType: 1, // LND.CommitmentType.STATIC_REMOTE_KEY
  ...value,
});

export const defaultLndPendingOpenChannel = (
  value: Partial<LND.PendingOpenChannel>,
): LND.PendingOpenChannel => {
  const { channel, ...rest } = value;
  return {
    channel: defaultLndPendingChannel(channel as LND.PendingChannel),
    confirmationHeight: 0,
    commitFee: '0',
    commitWeight: '0',
    feePerKw: '0',
    ...rest,
  };
};

export const defaultLndClosedChannel = (
  value: Partial<LND.ClosedChannel>,
): LND.ClosedChannel => {
  const { channel, ...rest } = value;
  return {
    channel: defaultLndPendingChannel(channel as LND.PendingChannel),
    closingTxid: '',
    ...rest,
  };
};

export const defaultLndForceClosedChannel = (
  value: Partial<LND.ForceClosedChannel>,
): LND.ForceClosedChannel => {
  const { channel, ...rest } = value;
  return {
    channel: defaultLndPendingChannel(channel as LND.PendingChannel),
    closingTxid: '',
    limboBalance: '0',
    maturityHeight: 0,
    blocksTilMaturity: 0,
    recoveredBalance: '0',
    pendingHtlcs: [],
    anchor: 0, // LND.AnchorState.LIMBO
    ...rest,
  };
};

export const defaultLndWaitingCloseChannel = (
  value: Partial<LND.WaitingCloseChannel>,
): LND.WaitingCloseChannel => {
  const { channel, ...rest } = value;
  return {
    channel: defaultLndPendingChannel(channel as LND.PendingChannel),
    limboBalance: '0',
    ...rest,
  };
};

export const defaultLndPendingChannels = (
  value: Partial<LND.PendingChannelsResponse>,
): LND.PendingChannelsResponse => {
  const {
    pendingOpenChannels,
    pendingClosingChannels,
    pendingForceClosingChannels,
    waitingCloseChannels,
    ...rest
  } = value;
  return {
    totalLimboBalance: '',
    pendingOpenChannels: mapArray(
      pendingOpenChannels || [],
      defaultLndPendingOpenChannel,
    ),
    pendingClosingChannels: mapArray(
      pendingClosingChannels || [],
      defaultLndClosedChannel,
    ),
    pendingForceClosingChannels: mapArray(
      pendingForceClosingChannels || [],
      defaultLndForceClosedChannel,
    ),
    waitingCloseChannels: mapArray(
      waitingCloseChannels || [],
      defaultLndWaitingCloseChannel,
    ),
    ...rest,
  };
};

const defaults = {
  [ipcChannels.getInfo]: defaultLndInfo,
  [ipcChannels.walletBalance]: defaultLndWalletBalance,
  [ipcChannels.listPeers]: defaultLndListPeers,
  [ipcChannels.openChannel]: defaultLndChannelPoint,
  [ipcChannels.listChannels]: defaultLndListChannels,
  [ipcChannels.pendingChannels]: defaultLndPendingChannels,
};

export type DefaultsKey = keyof typeof defaults;

/**
 * The LND API will omit falsey values in responses. This function will ensure the response
 * has sensible default values for each property of the response
 * @param values the actual values received from the LND API
 * @param key the key of the defaults object containing the default values for the response
 */
export const withDefaults = (values: any, key: DefaultsKey): any => {
  const func = defaults[key];
  return func ? func(values) : values;
};
