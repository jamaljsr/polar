/*
 * Shared types to normalize interfaces between the different
 * Taro implementations
 */

export interface TaroAsset {
  id: string;
  name: string;
  meta: string;
  amount: string;
  genesisPoint: string;
  genesisBootstrapInfo: string;
}
