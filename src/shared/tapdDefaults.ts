import {
  Addr,
  AssetRootResponse,
  FinalizeBatchResponse,
  ListAssetResponse,
  ListBalancesResponse,
  MintAssetResponse,
  SendAssetResponse,
  SyncResponse,
} from '@lightningpolar/tapd-api';
import ipcChannels from './ipcChannels';

export const defaultTapdListAssets = (
  value: Partial<ListAssetResponse>,
): ListAssetResponse => ({
  assets: [],
  unconfirmedTransfers: '0',
  unconfirmedMints: '0',
  ...value,
});

export const defaultTapdListBalances = (
  value: Partial<ListBalancesResponse>,
): ListBalancesResponse => ({
  assetBalances: {},
  assetGroupBalances: {},
  ...value,
});

export const defaultTapdMintAsset = (): MintAssetResponse => ({
  pendingBatch: {
    batchTxid: '',
    batchKey: Buffer.from(''),
    assets: [],
    state: 'BATCH_STATE_PENDING',
    createdAt: '',
    heightHint: 0,
    batchPsbt: Buffer.from(''),
  },
});

export const defaultTapdFinalizeBatch = (
  value: Partial<FinalizeBatchResponse>,
): FinalizeBatchResponse => ({
  batch: {
    batchTxid: '',
    batchKey: Buffer.from(''),
    assets: [],
    state: 'BATCH_STATE_FINALIZED',
    createdAt: '',
    heightHint: 0,
    batchPsbt: Buffer.from(''),
  },
  ...value,
});

export const defaultTapdNewAddress = (value: Partial<Addr>): Addr => ({
  encoded: '',
  assetId: Buffer.from(''),
  assetType: 'NORMAL',
  amount: '',
  groupKey: Buffer.from(''),
  scriptKey: Buffer.from(''),
  internalKey: Buffer.from(''),
  taprootOutputKey: Buffer.from(''),
  tapscriptSibling: Buffer.from(''),
  proofCourierAddr: '',
  assetVersion: 'ASSET_VERSION_V0',
  addressVersion: 'ADDR_VERSION_V0',
  ...value,
});

export const defaultTapdSendAsset = (
  value: Partial<SendAssetResponse>,
): SendAssetResponse => ({
  transfer: {
    anchorTxBlockHash: {
      hash: Buffer.from(''),
      hashStr: '',
    },
    anchorTxChainFees: '',
    anchorTxHash: Buffer.from(''),
    anchorTxHeightHint: 0,
    transferTimestamp: '',
    inputs: [],
    outputs: [],
  },
  ...value,
});

export const defaultAssetRoots = (
  value: Partial<AssetRootResponse>,
): AssetRootResponse => ({
  universeRoots: {},
  ...value,
});

export const defaultSyncUniverse = (value: Partial<SyncResponse>): SyncResponse => ({
  syncedUniverses: [],
  ...value,
});

const defaults = {
  [ipcChannels.tapd.listAssets]: defaultTapdListAssets,
  [ipcChannels.tapd.listBalances]: defaultTapdListBalances,
  [ipcChannels.tapd.mintAsset]: defaultTapdMintAsset,
  [ipcChannels.tapd.newAddress]: defaultTapdNewAddress,
  [ipcChannels.tapd.sendAsset]: defaultTapdSendAsset,
};

export type TapdDefaultsKey = keyof typeof defaults;

/**
 * The tapd API will omit falsey values in responses. This function will ensure the response
 * has sensible default values for each property of the response
 * @param values the actual values received from the tapd API
 * @param key the key of the defaults object containing the default values for the response
 */
export const withTapdDefaults = (values: any, key: TapdDefaultsKey): any => {
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
