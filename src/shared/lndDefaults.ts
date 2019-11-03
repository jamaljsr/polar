import * as LND from '@radar/lnrpc';
import { ipcChannels } from './';

const mapArray = <T>(arr: T[], func: (value: T) => T) => (arr || []).map(func);

export const defaultInfo = (
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
  testnet: false,
  chains: [],
  uris: [],
  bestHeaderTimestamp: '',
  version: '',
  numInactiveChannels: 0,
  color: '',
  ...value,
});

export const defaultWalletBalance = (
  value: Partial<LND.WalletBalanceResponse>,
): LND.WalletBalanceResponse => ({
  confirmedBalance: '0',
  totalBalance: '0',
  unconfirmedBalance: '0',
  ...value,
});

export const defaultListPeers = (
  value: Partial<LND.ListPeersResponse>,
): LND.ListPeersResponse => ({
  peers: [],
  ...value,
});

export const defaultChannelPoint = (
  value: Partial<LND.ChannelPoint>,
): LND.ChannelPoint => ({
  fundingTxidBytes: '',
  fundingTxidStr: '',
  outputIndex: 0,
  ...value,
});

export const defaultChannel = (value: Partial<LND.Channel>): LND.Channel => ({
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
  ...value,
});

export const defaultListChannels = (
  value: Partial<LND.ListChannelsResponse>,
): LND.ListChannelsResponse => ({
  channels: mapArray(value.channels || [], defaultChannel),
});

export const defaultPendingChannel = (
  value: Partial<LND.PendingChannel>,
): LND.PendingChannel => ({
  remoteNodePub: '',
  channelPoint: '',
  capacity: '0',
  localBalance: '0',
  remoteBalance: '0',
  localChanReserveSat: '0',
  remoteChanReserveSat: '0',
  ...value,
});

export const defaultPendingOpenChannel = (
  value: Partial<LND.PendingOpenChannel>,
): LND.PendingOpenChannel => {
  const { channel, ...rest } = value;
  return {
    channel: defaultPendingChannel(channel as LND.PendingChannel),
    confirmationHeight: 0,
    commitFee: '0',
    commitWeight: '0',
    feePerKw: '0',
    ...rest,
  };
};

export const defaultClosedChannel = (
  value: Partial<LND.ClosedChannel>,
): LND.ClosedChannel => {
  const { channel, ...rest } = value;
  return {
    channel: defaultPendingChannel(channel as LND.PendingChannel),
    closingTxid: '',
    ...rest,
  };
};

export const defaultForceClosedChannel = (
  value: Partial<LND.ForceClosedChannel>,
): LND.ForceClosedChannel => {
  const { channel, ...rest } = value;
  return {
    channel: defaultPendingChannel(channel as LND.PendingChannel),
    closingTxid: '',
    limboBalance: '0',
    maturityHeight: 0,
    blocksTilMaturity: 0,
    recoveredBalance: '0',
    pendingHtlcs: [],
    ...rest,
  };
};

export const defaultWaitingCloseChannel = (
  value: Partial<LND.WaitingCloseChannel>,
): LND.WaitingCloseChannel => {
  const { channel, ...rest } = value;
  return {
    channel: defaultPendingChannel(channel as LND.PendingChannel),
    limboBalance: '0',
    ...rest,
  };
};

export const defaultPendingChannels = (
  value: Partial<LND.PendingChannelsResponse>,
): LND.PendingChannelsResponse => ({
  totalLimboBalance: '',
  pendingOpenChannels: mapArray(
    value.pendingOpenChannels || [],
    defaultPendingOpenChannel,
  ),
  pendingClosingChannels: mapArray(
    value.pendingClosingChannels || [],
    defaultClosedChannel,
  ),
  pendingForceClosingChannels: mapArray(
    value.pendingForceClosingChannels || [],
    defaultForceClosedChannel,
  ),
  waitingCloseChannels: mapArray(
    value.waitingCloseChannels || [],
    defaultWaitingCloseChannel,
  ),
  ...value,
});

const defaults = {
  [ipcChannels.getInfo]: defaultInfo,
  [ipcChannels.walletBalance]: defaultWalletBalance,
  [ipcChannels.listPeers]: defaultListPeers,
  [ipcChannels.openChannel]: defaultChannelPoint,
  [ipcChannels.listChannels]: defaultListChannels,
  [ipcChannels.pendingChannels]: defaultPendingChannels,
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
