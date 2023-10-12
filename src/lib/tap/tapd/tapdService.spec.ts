import { Asset, AssetBalance } from '@lightningpolar/tapd-api';
import {
  defaultAssetRoots,
  defaultSyncUniverse,
  defaultTapdFinalizeBatch,
  defaultTapdListAssets,
  defaultTapdListBalances,
  defaultTapdMintAsset,
  defaultTapdNewAddress,
  defaultTapdSendAsset,
} from 'shared';
import { TapdNode } from 'shared/types';
import { getNetwork } from 'utils/tests';
import tapdProxyClient from './tapdProxyClient';
import tapdService from './tapdService';

jest.mock('./tapdProxyClient');

const sampleAsset: Asset = {
  version: 'ASSET_VERSION_V0',
  assetGenesis: {
    genesisPoint: '64e4cf735588364a5770712fa8836d6d1464f60227817697664f2c2937619c58:0',
    name: 'LUSD',
    metaHash: Buffer.from('66616e746173746963206d6f6e6579'), // fantastic money
    assetId: Buffer.from(
      'b4b9058fa9621541ed67d470c9f250e5671e484ebc45ad4ba85d5d2fcf7b200b',
    ),
    outputIndex: 0,
    version: 0,
  },
  assetType: 'NORMAL',
  amount: '900',
  lockTime: 0,
  relativeLockTime: 0,
  scriptVersion: 0,
  scriptKey: Buffer.from(
    '02f758c6f4b2d0df3bd7b6ba3e9ef3c34d51c0f6df682396a88b826326b2e98f3f',
  ),
  scriptKeyIsLocal: true,
  assetGroup: null,
  chainAnchor: {
    anchorTx: Buffer.from(
      '02000000000102217b7c61d585238f5e1a614ef5c4041c32ca9eedcae38c608b22dc5d256410110100000000ffffffff217b7c61d585238f5e1a614ef5c4041c32ca9eedcae38c608b22dc5d2564101100000000000000000003e803000000000000225120540b38f3ef8dcf37d5c85b89d5ba15274cdc13f4d7cf300cfcdeedc3b1335d6de8030000000000002251205f158a5743cd9747732cb03b0a605cb08719ff5cf58234b7ec5276c851494e6e81e80e0000000000225120c2b958e9c347a30781e358940d20adef09079ae604faa509a34d789d5697e4c40140786d837c15c27efdf459b071a8b68691080c0e6c4d152b15cd359254e1408f76f2e8ca8680b0035202bb9e5407101aca5fa45a3c556f7e28cf275f19a584dd4001407883d96a241cd6354efacea726b0abbb8ec63f8b417d1cc5bb903078761dd0da58573a11972204a056bcc5f2c489682e5122521c128d7015a8bca7b1b690691100000000',
    ),
    anchorTxid: '3e946b82861faedf8176cf790aeeb9fe3e70247b80ed0f510c62c4055ebea8f7',
    anchorBlockHash: '6a748adfd6a1399d08978c117767b29fe83ede8fe4cb0186eba41e942dd04542',
    anchorOutpoint: 'f7a8be5e05c4620c510fed807b24703efeb9ee0a79cf7681dfae1f86826b943e:0',
    internalKey: Buffer.from(
      '03eb44c581b4955fd4c8200ac2fe815b4e0bdeb4e13f7d027340aab8f4964ecc77',
    ),
    merkleRoot: Buffer.from(
      'dc886ced95397e55f52cc348196c5176adf888cb6f6a74bcd9305a48d95bfb9b',
    ),
    tapscriptSibling: Buffer.from(''),
    blockHeight: 0,
  },
  prevWitnesses: [],
  isSpent: false,
  leaseOwner: Buffer.from(''),
  leaseExpiry: '0',
  isBurn: false,
};

const sampleBalance: AssetBalance = {
  assetGenesis: {
    genesisPoint: '64e4cf735588364a5770712fa8836d6d1464f60227817697664f2c2937619c58:0',
    name: 'LUSD',
    metaHash: Buffer.from('66616e746173746963206d6f6e6579'), // fantastic money
    assetId: Buffer.from(
      'b4b9058fa9621541ed67d470c9f250e5671e484ebc45ad4ba85d5d2fcf7b200b',
    ),
    outputIndex: 0,
    version: 0,
  },
  assetType: 'NORMAL',
  balance: '100',
};

describe('TapdService', () => {
  const node = getNetwork(1, 'test network', undefined, 2).nodes.tap[0] as TapdNode;

  it('should get a new address', async () => {
    const apiResponse = defaultTapdNewAddress({
      assetId: sampleAsset.assetGenesis?.assetId,
    });
    const expected = expect.objectContaining({
      id: 'b4b9058fa9621541ed67d470c9f250e5671e484ebc45ad4ba85d5d2fcf7b200b',
    });
    tapdProxyClient.newAddress = jest.fn().mockResolvedValue(apiResponse);
    const actual = await tapdService.newAddress(node, 'test id', '10');
    expect(actual).toEqual(expected);
  });

  it('should mint an asset', async () => {
    const apiResponse = defaultTapdMintAsset();
    const expected = expect.objectContaining({ pendingBatch: expect.anything() });
    tapdProxyClient.mintAsset = jest.fn().mockResolvedValue(apiResponse);
    const actual = await tapdService.mintAsset(node, {});
    expect(actual).toEqual(expected);
  });

  it('should finalize a batch', async () => {
    const apiResponse = defaultTapdFinalizeBatch({});
    const expected = expect.objectContaining({ batch: expect.anything() });
    tapdProxyClient.finalizeBatch = jest.fn().mockResolvedValue(apiResponse);
    const actual = await tapdService.finalizeBatch(node);
    expect(actual).toEqual(expected);
  });

  it('should send an asset', async () => {
    const txid = 'b4b9058fa9621541ed67d470c9f250e5671e484ebc45ad4ba85d5d2fcf7b200b';
    const apiResponse = defaultTapdSendAsset({
      transfer: {
        anchorTxChainFees: '',
        anchorTxHash: Buffer.from(txid, 'hex'),
        anchorTxHeightHint: 0,
        transferTimestamp: '',
        inputs: [],
        outputs: [],
      },
    });
    const expected = { transferTxid: txid };

    tapdProxyClient.sendAsset = jest.fn().mockResolvedValue(apiResponse);
    const actual = await tapdService.sendAsset(node, {
      tapAddrs: ['addr'],
    });
    expect(actual).toEqual(expected);
  });

  it('shoud decode an address', async () => {
    const apiResponse = defaultTapdNewAddress({});
    const expected = expect.objectContaining({
      encoded: expect.anything(),
      id: expect.anything(),
      type: expect.anything(),
      amount: expect.anything(),
      family: expect.anything(),
      scriptKey: expect.anything(),
      internalKey: expect.anything(),
      taprootOutputKey: expect.anything(),
    });
    tapdProxyClient.decodeAddress = jest.fn().mockResolvedValue(apiResponse);
    const actual = await tapdService.decodeAddress(node, {
      addr: 'addr',
    });
    expect(actual).toEqual(expected);
  });

  it('should list assets', async () => {
    const apiResponse = defaultTapdListAssets({ assets: [sampleAsset] });
    const expected = [
      expect.objectContaining({
        id: 'b4b9058fa9621541ed67d470c9f250e5671e484ebc45ad4ba85d5d2fcf7b200b',
        name: 'LUSD',
        type: 'NORMAL',
        amount: '900',
        anchorOutpoint:
          'f7a8be5e05c4620c510fed807b24703efeb9ee0a79cf7681dfae1f86826b943e:0',
        genesisPoint:
          '64e4cf735588364a5770712fa8836d6d1464f60227817697664f2c2937619c58:0',
        groupKey: '',
      }),
    ];
    tapdProxyClient.listAssets = jest.fn().mockResolvedValue(apiResponse);
    const actual = await tapdService.listAssets(node);
    expect(actual).toEqual(expected);
  });

  it('should list balances', async () => {
    const apiResponse = defaultTapdListBalances({
      assetBalances: {
        b4b9058fa9621541ed67d470c9f250e5671e484ebc45ad4ba85d5d2fcf7b200b: sampleBalance,
      },
      assetGroupBalances: {},
    });
    const expected = [
      expect.objectContaining({
        id: 'b4b9058fa9621541ed67d470c9f250e5671e484ebc45ad4ba85d5d2fcf7b200b',
        name: 'LUSD',
        type: 'NORMAL',
        balance: '100',
        genesisPoint:
          '64e4cf735588364a5770712fa8836d6d1464f60227817697664f2c2937619c58:0',
      }),
    ];
    tapdProxyClient.listBalances = jest.fn().mockResolvedValue(apiResponse);
    const actual = await tapdService.listBalances(node);
    expect(actual).toEqual(expected);
  });

  it('should list asset roots', async () => {
    const apiResponse = defaultAssetRoots({
      universeRoots: {
        b4b9058fa9621541ed67d470c9f250e5671e484ebc45ad4ba85d5d2fcf7b200b: {
          id: {
            id: 'assetId',
            assetId: Buffer.from('assetId'),
            proofType: 'PROOF_TYPE_UNSPECIFIED',
          },
          assetName: 'LUSD',
          mssmtRoot: {
            rootSum: '1000',
            rootHash: Buffer.from('rootHash'),
          },
          amountsByAssetId: {
            b4b9058fa9621541ed67d470c9f250e5671e484ebc45ad4ba85d5d2fcf7b200b: '1000',
          },
        },
        a0357038c14f35f4a7617ecd59447b1c039139c56d7008097b2fa289979bb651d5: {
          id: {
            id: 'assetId',
            assetId: Buffer.from('assetId'),
            proofType: 'PROOF_TYPE_UNSPECIFIED',
          },
          assetName: 'ASDF',
          mssmtRoot: {
            rootSum: '',
            rootHash: Buffer.from('rootHash'),
          },
          amountsByAssetId: {
            a0357038c14f35f4a7617ecd59447b1c039139c56d7008097b2fa289979bb651d5: '0',
          },
        },
      },
    });
    const expected = [
      {
        id: 'b4b9058fa9621541ed67d470c9f250e5671e484ebc45ad4ba85d5d2fcf7b200b',
        name: 'LUSD',
        rootSum: 1000,
      },
      {
        id: 'a0357038c14f35f4a7617ecd59447b1c039139c56d7008097b2fa289979bb651d5',
        name: 'ASDF',
        rootSum: 0,
      },
    ];
    tapdProxyClient.assetRoots = jest.fn().mockResolvedValue(apiResponse);
    const actual = await tapdService.assetRoots(node);
    expect(actual).toEqual(expected);
  });

  it('should sync the universe', async () => {
    const apiResponse = defaultSyncUniverse({
      syncedUniverses: ['dummy-data' as any],
    });
    const expected = {
      syncedUniverses: ['dummy-data'],
    };
    tapdProxyClient.syncUniverse = jest.fn().mockResolvedValue(apiResponse);
    const actual = await tapdService.syncUniverse(node, 'host');
    expect(actual).toEqual(expected);
  });

  it('should throw an error for an incorrect node', async () => {
    const badNode = {
      ...node,
      implementation: 'LND' as any,
    };
    await expect(tapdService.listAssets(badNode)).rejects.toThrow(
      "TapdService cannot be used for 'LND' nodes",
    );
  });

  describe('waitUntilOnline', () => {
    it('should wait successfully', async () => {
      const apiResponse = defaultTapdListAssets({ assets: [sampleAsset] });
      tapdProxyClient.listAssets = jest.fn().mockResolvedValue(apiResponse);
      await expect(tapdService.waitUntilOnline(node)).resolves.not.toThrow();
      expect(tapdProxyClient.listAssets).toBeCalledTimes(1);
    });

    it('should throw error if waiting fails', async () => {
      tapdProxyClient.listAssets = jest.fn().mockRejectedValue(new Error('test-error'));
      await expect(tapdService.waitUntilOnline(node, 0.5, 1)).rejects.toThrow(
        'test-error',
      );
      expect(tapdProxyClient.listAssets).toBeCalledTimes(4);
    });
  });
});
