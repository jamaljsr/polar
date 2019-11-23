import { LightningNodeBalances, LightningNodeInfo } from 'lib/lightning/types';

export const defaultStateInfo = (
  value: Partial<LightningNodeInfo>,
): LightningNodeInfo => ({
  pubkey: '',
  alias: '',
  rpcUrl: '',
  syncedToChain: false,
  numPendingChannels: 0,
  numInactiveChannels: 0,
  numActiveChannels: 0,
  ...value,
});

export const defaultStateBalances = (
  value: Partial<LightningNodeBalances>,
): LightningNodeBalances => ({
  confirmed: '0',
  total: '0',
  unconfirmed: '0',
  ...value,
});
