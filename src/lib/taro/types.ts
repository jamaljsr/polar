/*
 * Shared types to normalize interfaces between the different
 * Taro implementations
 */

export interface TaroAsset {
  id: string;
  name: string;
  meta: string;
  type: string;
  amount: string;
  genesisPoint: string;
  genesisBootstrapInfo: string;
  anchorOutpoint: string;
}

export interface TaroBalance {
  id: string;
  name: string;
  meta: string;
  type: string;
  balance: string;
  genesisPoint: string;
  genesisBootstrapInfo: string;
  groupKey?: string;
}

export interface TaroAssetReciept {
  batchKey: string;
}
