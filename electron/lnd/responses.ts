import * as LND from '@radar/lnrpc';
import { ipcChannels } from '../../src/shared';

const defaultChannel = (value: LND.Channel): LND.Channel => ({
  active: false,
  remotePubkey: '',
  channelPoint: '',
  chanId: '',
  capacity: '',
  localBalance: '',
  remoteBalance: '',
  commitFee: '',
  commitWeight: '',
  feePerKw: '',
  unsettledBalance: '',
  totalSatoshisSent: '',
  totalSatoshisReceived: '',
  numUpdates: '',
  pendingHtlcs: [],
  csvDelay: 0,
  private: false,
  initiator: false,
  chanStatusFlags: '',
  localChanReserveSat: '',
  remoteChanReserveSat: '',
  ...value,
});

const defaultPendingChannel = (value: LND.PendingChannel): LND.PendingChannel => ({
  remoteNodePub: '',
  channelPoint: '',
  capacity: '',
  localBalance: '',
  remoteBalance: '',
  localChanReserveSat: '',
  remoteChanReserveSat: '',
  ...value,
});

const defaultPendingOpenChannel = (
  value: LND.PendingOpenChannel,
): LND.PendingOpenChannel => ({
  channel: defaultPendingChannel(value.channel as LND.PendingChannel),
  confirmationHeight: 0,
  commitFee: '',
  commitWeight: '',
  feePerKw: '',
  ...value,
});

const defaultClosedChannel = (value: LND.ClosedChannel): LND.ClosedChannel => ({
  channel: defaultPendingChannel(value.channel as LND.PendingChannel),
  closingTxid: '',
  ...value,
});

const defaultForceClosedChannel = (
  value: LND.ForceClosedChannel,
): LND.ForceClosedChannel => ({
  channel: defaultPendingChannel(value.channel as LND.PendingChannel),
  closingTxid: '',
  limboBalance: '',
  maturityHeight: 0,
  blocksTilMaturity: 0,
  recoveredBalance: '',
  pendingHtlcs: [],
  ...value,
});

const defaultWaitingCloseChannel = (
  value: LND.WaitingCloseChannel,
): LND.WaitingCloseChannel => ({
  channel: defaultPendingChannel(value.channel as LND.PendingChannel),
  limboBalance: '',
  ...value,
});

const mapArray = <T>(arr: T[], func: (value: T) => T) => (arr || []).map(func);

const defaults = {
  [ipcChannels.getInfo]: {
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
  } as LND.GetInfoResponse,
  [ipcChannels.walletBalance]: {
    confirmedBalance: '0',
    totalBalance: '0',
    unconfirmedBalance: '0',
  } as LND.WalletBalanceResponse,
  [ipcChannels.listPeers]: {
    peers: [],
  } as LND.ListPeersResponse,
  [ipcChannels.openChannel]: {
    fundingTxidBytes: '',
    fundingTxidStr: '',
    outputIndex: 0,
  } as LND.ChannelPoint,
  [ipcChannels.listChannels]: (
    values: LND.ListChannelsResponse,
  ): LND.ListChannelsResponse => ({
    channels: mapArray(values.channels, defaultChannel),
  }),
  [ipcChannels.pendingChannels]: (
    values: LND.PendingChannelsResponse,
  ): LND.PendingChannelsResponse => ({
    totalLimboBalance: '',
    pendingOpenChannels: mapArray(values.pendingOpenChannels, defaultPendingOpenChannel),
    pendingClosingChannels: mapArray(values.pendingClosingChannels, defaultClosedChannel),
    pendingForceClosingChannels: mapArray(
      values.pendingForceClosingChannels,
      defaultForceClosedChannel,
    ),
    waitingCloseChannels: mapArray(
      values.waitingCloseChannels,
      defaultWaitingCloseChannel,
    ),
  }),
};

export type DefaultsKey = keyof typeof defaults;

/**
 * The LND API will omit falsey values in responses. This function will ensure the response
 * has sensible default values for each property of the response
 * @param values the actual values received from the LND API
 * @param key the key of the defaults object containing the default values for the response
 */
export const withDefaults = <T>(values: T, key: DefaultsKey): T => {
  return {
    ...(defaults[key] || {}),
    ...values,
  };
};
