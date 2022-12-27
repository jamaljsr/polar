import ipcChannels from './ipcChannels';
import { ListAssetsResponse } from './tarodTypes';

export const defaultTarodListAssets = (
  value: Partial<ListAssetsResponse>,
): ListAssetsResponse => ({
  assets: [],
  ...value,
});

const defaults = {
  [ipcChannels.taro.listAssets]: defaultTarodListAssets,
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
