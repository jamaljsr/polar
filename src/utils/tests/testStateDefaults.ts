import {
  LightningNodeBalances,
  LightningNodeChannel,
  LightningNodeInfo,
} from 'lib/lightning/types';
import { Session } from 'lib/litd/types';
import { TapAddress, TapAsset, TapBalance } from 'lib/tap/types';

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

export const defaultTapAsset = (value: Partial<TapAsset>): TapAsset => ({
  id: '',
  name: '',
  type: '',
  amount: '',
  genesisPoint: '',
  anchorOutpoint: '',
  groupKey: '',
  decimals: 0,
  ...value,
});

export const defaultTapBalance = (value: Partial<TapBalance>): TapBalance => ({
  id: '',
  name: '',
  type: '',
  balance: '',
  genesisPoint: '',
  groupKey: '',
  ...value,
});

export const defaultTapAddress = (value: Partial<TapAddress>): TapAddress => ({
  encoded: '',
  id: '',
  type: '',
  amount: '',
  family: '',
  scriptKey: '',
  internalKey: '',
  taprootOutputKey: '',
  ...value,
});

export const defaultLitSession = (value: Partial<Session>): Session => ({
  id: '',
  label: '',
  pairingPhrase: '',
  mailboxServerAddr: '',
  state: 'Created',
  type: 'Admin',
  accountId: '',
  localPublicKey: '',
  remotePublicKey: '',
  createdAt: 0,
  expiresAt: 0,
  ...value,
});
