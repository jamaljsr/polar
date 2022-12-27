import ipcChannels from './ipcChannels';
import { ListAssetResponse, ListBalancesResponse } from './tarodTypes';

export const defaultTarodListAssets = (
  value: Partial<ListAssetResponse>,
): ListAssetResponse => ({
  assets: [],
  ...value,
});

export const defaultTarodListBalances = (
  value: Partial<ListBalancesResponse>,
): ListBalancesResponse => ({
  assetBalances: {},
  assetGroupBalances: {},
  ...value,
});

const defaults = {
  [ipcChannels.taro.listAssets]: defaultTarodListAssets,
  [ipcChannels.taro.listBalances]: defaultTarodListAssets,
};

export type TarodDefaultsKey = keyof typeof defaults;

/**
 * The tarod API will omit falsey values in responses. This function will ensure the response
 * has sensible default values for each property of the response
 * @param values the actual values received from the tarod API
 * @param key the key of the defaults object containing the default values for the response
 */
export const withTarodDefaults = (values: any, key: TarodDefaultsKey): any => {
  const func = defaults[key];
  return func ? func(values) : values;
};
