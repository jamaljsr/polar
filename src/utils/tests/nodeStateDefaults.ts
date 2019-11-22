import { LightningNodeInfo } from 'lib/lightning/types';

export const defaultInfo = (value: Partial<LightningNodeInfo>): LightningNodeInfo => ({
  pubkey: '',
  alias: '',
  rpcUrl: '',
  syncedToChain: false,
  numPendingChannels: 0,
  numInactiveChannels: 0,
  numActiveChannels: 0,
  ...value,
});
