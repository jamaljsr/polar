import * as LND from '@radar/lnrpc';

const defaults = {
  'get-info': {
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
  'wallet-balance': {
    confirmedBalance: '0',
    totalBalance: '0',
    unconfirmedBalance: '0',
  } as LND.WalletBalanceResponse,
  'open-channel': {
    fundingTxidBytes: '',
    fundingTxidStr: '',
    outputIndex: 0,
  } as LND.ChannelPoint,
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
