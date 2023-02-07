import {
  LightningNodeBalances,
  LightningNodeChannel,
  LightningNodeInfo,
} from 'lib/lightning/types';
import { TaroAddress, TaroAsset, TaroBalance } from 'lib/taro/types';

export const defaultStateInfo = (
  value: Partial<LightningNodeInfo>,
): LightningNodeInfo => ({
  pubkey: '',
  alias: '',
  rpcUrl: '',
  syncedToChain: false,
  blockHeight: 0,
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

export const defaultStateChannel = (
  value: Partial<LightningNodeChannel>,
): LightningNodeChannel => ({
  pending: false,
  uniqueId: '',
  channelPoint: '',
  pubkey: '',
  capacity: '',
  localBalance: '',
  remoteBalance: '',
  status: 'Open',
  isPrivate: false,
  ...value,
});

export const defaultTaroAsset = (value: Partial<TaroAsset>): TaroAsset => ({
  id: '',
  name: '',
  meta: '',
  type: '',
  amount: '',
  genesisPoint: '',
  genesisBootstrapInfo: '',
  anchorOutpoint: '',
  ...value,
});

export const defaultTaroBalance = (value: Partial<TaroBalance>): TaroBalance => ({
  id: '',
  name: '',
  meta: '',
  type: '',
  balance: '',
  genesisPoint: '',
  genesisBootstrapInfo: '',
  groupKey: '',
  ...value,
});

export const defaultTaroAddress = (value: Partial<TaroAddress>): TaroAddress => ({
  encoded: 'asdf',
  id: '',
  type: '',
  amount: '',
  family: '',
  scriptKey: '',
  internalKey: '',
  taprootOutputKey: '',
  ...value,
});
