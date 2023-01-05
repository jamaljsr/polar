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

export const defaultTarodMintAsset = (
  value: Partial<MintAssetResponse>,
): MintAssetResponse => ({
  batchKey: Buffer.from('none'),
});

const defaults = {
  [ipcChannels.taro.listAssets]: defaultTarodListAssets,
  [ipcChannels.taro.listBalances]: defaultTarodListBalances,
  [ipcChannels.taro.mintAsset]: defaultTarodMintAsset,
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

/**
 * Recursively converts all UInt8Array values in an object to strings encoded in hex
 */
export const convertUInt8ArraysToHex = (obj: any) => {
  // do nothing if it is not a plain JS object
  if (!isPlainObject(obj)) return obj;

  const newValue: { [key: string]: any } = {};
  Object.entries(obj).forEach(([key, val]) => {
    if (val instanceof Uint8Array) {
      // convert UInt8Array to hex encoding
      newValue[key] = Buffer.from(val).toString('hex');
    } else if (isPlainObject(val)) {
      newValue[key] = convertUInt8ArraysToHex(val);
    } else if (Array.isArray(val)) {
      newValue[key] = val.map(convertUInt8ArraysToHex);
    } else {
      newValue[key] = val;
    }
  });
  return newValue;
};

/**
 * Returns true if the value is a plain JS object. Ex: { color: 'red' }
 */
const isPlainObject = (value: any) => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);
  return (
    (prototype === null ||
      prototype === Object.prototype ||
      Object.getPrototypeOf(prototype) === null) &&
    !(Symbol.toStringTag in value) &&
    !(Symbol.iterator in value)
  );
};
