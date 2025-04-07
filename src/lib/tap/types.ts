/*
 * Shared types to normalize interfaces between the different
 * TAP implementations
 */
export interface TapAsset {
  id: string;
  name: string;
  type: string;
  amount: string;
  genesisPoint: string;
  anchorOutpoint: string;
  groupKey: string;
  decimals: number;
}

export interface TapBalance {
  id: string;
  name: string;
  type: string;
  balance: string;
  genesisPoint: string;
  groupKey?: string;
}

export interface TapAssetReceipt {
  batchKey: string;
}

export interface TapAddress {
  encoded: string;
  id: string;
  type: string;
  amount: string;
  family: string | undefined;
  scriptKey: string;
  internalKey: string;
  taprootOutputKey: string;
}

export interface TapSendAssetReceipt {
  transferTxid: string;
}

export interface TapAssetRoot {
  id: string;
  name: string;
  rootSum: number;
}

export interface BuyOrder {
  askPrice: string;
  scid: string;
}

export interface SellOrder {
  bidPrice: string;
  scid: string;
  id: string;
}

export enum TAP_ASSET_TYPE {
  NORMAL = 'NORMAL',
  COLLECTIBLE = 'COLLECTIBLE',
}
