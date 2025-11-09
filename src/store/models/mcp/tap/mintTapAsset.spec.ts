import { createStore } from 'easy-peasy';
import { Status } from 'shared/types';
import { TAP_ASSET_TYPE } from 'lib/tap/types';
import { createLitdNetworkNode } from 'utils/network';
import {
  createMockRootModel,
  getNetwork,
  injections,
  lightningServiceMock,
  tapServiceMock,
  testNodeDocker,
  testRepoState,
} from 'utils/tests';
import { MintTapAssetArgs, mintTapAssetDefinition } from './mintTapAsset';

jest.mock('electron-log');

describe('mintTapAsset Tool', () => {
  const rootModel = createMockRootModel();

  // initialize store for type inference
  let store = createStore(rootModel, { injections });

  beforeEach(() => {
    // reset the store before each test run
    store = createStore(rootModel, { injections });
  });

  describe('mintTapAssetDefinition', () => {
    it('should have correct name', () => {
      expect(mintTapAssetDefinition.name).toBe('mint_tap_asset');
    });

    it('should have a description', () => {
      expect(mintTapAssetDefinition.description).toBeTruthy();
      expect(mintTapAssetDefinition.description).toContain('Mint a new Taproot Asset');
    });

    it('should have input schema with required fields', () => {
      expect(mintTapAssetDefinition.inputSchema.type).toBe('object');
      expect(mintTapAssetDefinition.inputSchema.properties).toHaveProperty('networkId');
      expect(mintTapAssetDefinition.inputSchema.properties).toHaveProperty('nodeName');
      expect(mintTapAssetDefinition.inputSchema.properties).toHaveProperty('assetType');
      expect(mintTapAssetDefinition.inputSchema.properties).toHaveProperty('name');
      expect(mintTapAssetDefinition.inputSchema.properties).toHaveProperty('amount');
      expect(mintTapAssetDefinition.inputSchema.required).toEqual([
        'networkId',
        'nodeName',
        'assetType',
        'name',
        'amount',
      ]);
    });

    it('should have optional parameters', () => {
      expect(mintTapAssetDefinition.inputSchema.properties).toHaveProperty('decimals');
      expect(mintTapAssetDefinition.inputSchema.properties).toHaveProperty(
        'enableEmission',
      );
      expect(mintTapAssetDefinition.inputSchema.properties).toHaveProperty('finalize');
      expect(mintTapAssetDefinition.inputSchema.properties).toHaveProperty('autoFund');
    });

    it('should specify assetType enum values', () => {
      expect(mintTapAssetDefinition.inputSchema.properties.assetType.enum).toEqual([
        'normal',
        'collectible',
      ]);
    });

    it('should specify amount minimum value', () => {
      expect(mintTapAssetDefinition.inputSchema.properties.amount.minimum).toBe(1);
    });

    it('should specify decimals range', () => {
      expect(mintTapAssetDefinition.inputSchema.properties.decimals.minimum).toBe(0);
      expect(mintTapAssetDefinition.inputSchema.properties.decimals.maximum).toBe(8);
    });
  });

  describe('mintTapAssetTool', () => {
    it('should mint normal asset successfully', async () => {
      const network = getNetwork(1, 'test', Status.Started, 1);
      store.getActions().network.setNetworks([network]);

      const spy = jest
        .spyOn(store.getActions().tap, 'mintAsset')
        .mockResolvedValue({ pendingBatch: { batchKey: 'batch123' } } as any);

      const args: MintTapAssetArgs = {
        networkId: network.id,
        nodeName: network.nodes.tap[0].name,
        assetType: 'normal',
        name: 'TestAsset',
        amount: 1000,
        decimals: 2,
        enableEmission: true,
        finalize: true,
        autoFund: true,
      };

      const result = await store.getActions().mcp.mintTapAsset(args);

      expect(result.success).toBe(true);
      expect(result.message).toContain('Minted normal asset "TestAsset"');
      expect(result.networkId).toBe(network.id);
      expect(result.nodeName).toBe(network.nodes.tap[0].name);
      expect(result.assetName).toBe('TestAsset');
      expect(result.assetType).toBe('normal');
      expect(result.amount).toBe(1000);
      expect(result.batchKey).toBe('batch123');
      expect(spy).toHaveBeenCalledWith({
        node: expect.objectContaining({ name: network.nodes.tap[0].name }),
        assetType: TAP_ASSET_TYPE.NORMAL,
        name: 'TestAsset',
        amount: 1000,
        decimals: 2,
        enableEmission: true,
        finalize: true,
        autoFund: true,
      });
    });

    it('should mint collectible asset successfully', async () => {
      const network = getNetwork(1, 'test', Status.Started, 1);
      store.getActions().network.setNetworks([network]);

      const spy = jest
        .spyOn(store.getActions().tap, 'mintAsset')
        .mockResolvedValue({ pendingBatch: { batchKey: 'batch456' } } as any);

      const args: MintTapAssetArgs = {
        networkId: network.id,
        nodeName: network.nodes.tap[0].name,
        assetType: 'collectible',
        name: 'NFT001',
        amount: 1,
      };

      const result = await store.getActions().mcp.mintTapAsset(args);

      expect(result.success).toBe(true);
      expect(result.message).toContain('Minted collectible asset "NFT001"');
      expect(result.assetType).toBe('collectible');
      expect(result.amount).toBe(1);
      expect(result.batchKey).toBe('batch456');
      expect(spy).toHaveBeenCalledWith({
        node: expect.objectContaining({ name: network.nodes.tap[0].name }),
        assetType: TAP_ASSET_TYPE.COLLECTIBLE,
        name: 'NFT001',
        amount: 1,
        decimals: 0,
        enableEmission: false,
        finalize: true,
        autoFund: true,
      });
    });

    it('should use default values for optional parameters', async () => {
      const network = getNetwork(1, 'test', Status.Started, 1);
      store.getActions().network.setNetworks([network]);

      const spy = jest
        .spyOn(store.getActions().tap, 'mintAsset')
        .mockResolvedValue({ pendingBatch: { batchKey: 'batch789' } } as any);

      const args: MintTapAssetArgs = {
        networkId: network.id,
        nodeName: network.nodes.tap[0].name,
        assetType: 'normal',
        name: 'DefaultAsset',
        amount: 500,
      };

      await store.getActions().mcp.mintTapAsset(args);

      expect(spy).toHaveBeenCalledWith({
        node: expect.objectContaining({ name: network.nodes.tap[0].name }),
        assetType: TAP_ASSET_TYPE.NORMAL,
        name: 'DefaultAsset',
        amount: 500,
        decimals: 0,
        enableEmission: false,
        finalize: true,
        autoFund: true,
      });
    });

    it('should handle missing batch key', async () => {
      const network = getNetwork(1, 'test', Status.Started, 1);
      store.getActions().network.setNetworks([network]);

      jest.spyOn(store.getActions().tap, 'mintAsset').mockResolvedValue({} as any);

      const args: MintTapAssetArgs = {
        networkId: network.id,
        nodeName: network.nodes.tap[0].name,
        assetType: 'normal',
        name: 'TestAsset',
        amount: 100,
      };

      const result = await store.getActions().mcp.mintTapAsset(args);

      expect(result.success).toBe(true);
      expect(result.batchKey).toBe('');
    });

    it('should throw error if networkId is missing', async () => {
      const args = {
        nodeName: 'tapd1',
        assetType: 'normal',
        name: 'TestAsset',
        amount: 100,
      } as any;

      await expect(store.getActions().mcp.mintTapAsset(args)).rejects.toThrow(
        'Network ID is required',
      );
    });

    it('should throw error if nodeName is missing', async () => {
      const args = {
        networkId: 1,
        assetType: 'normal',
        name: 'TestAsset',
        amount: 100,
      } as any;

      await expect(store.getActions().mcp.mintTapAsset(args)).rejects.toThrow(
        'Node name is required',
      );
    });

    it('should throw error if assetType is missing', async () => {
      const network = getNetwork(1, 'test', Status.Started, 1);
      store.getActions().network.setNetworks([network]);

      const args = {
        networkId: network.id,
        nodeName: network.nodes.tap[0].name,
        name: 'TestAsset',
        amount: 100,
      } as any;

      await expect(store.getActions().mcp.mintTapAsset(args)).rejects.toThrow(
        'Asset type is required',
      );
    });

    it('should throw error if assetType is invalid', async () => {
      const network = getNetwork(1, 'test', Status.Started, 1);
      store.getActions().network.setNetworks([network]);

      const args = {
        networkId: network.id,
        nodeName: network.nodes.tap[0].name,
        assetType: 'invalid',
        name: 'TestAsset',
        amount: 100,
      } as any;

      await expect(store.getActions().mcp.mintTapAsset(args)).rejects.toThrow(
        'Asset type must be "normal" or "collectible"',
      );
    });

    it('should throw error if name is missing', async () => {
      const network = getNetwork(1, 'test', Status.Started, 1);
      store.getActions().network.setNetworks([network]);

      const args = {
        networkId: network.id,
        nodeName: network.nodes.tap[0].name,
        assetType: 'normal',
        amount: 100,
      } as any;

      await expect(store.getActions().mcp.mintTapAsset(args)).rejects.toThrow(
        'Asset name is required',
      );
    });

    it('should throw error if amount is missing', async () => {
      const network = getNetwork(1, 'test', Status.Started, 1);
      store.getActions().network.setNetworks([network]);

      const args = {
        networkId: network.id,
        nodeName: network.nodes.tap[0].name,
        assetType: 'normal',
        name: 'TestAsset',
      } as any;

      await expect(store.getActions().mcp.mintTapAsset(args)).rejects.toThrow(
        'Amount must be greater than 0',
      );
    });

    it('should throw error if amount is less than 1', async () => {
      const network = getNetwork(1, 'test', Status.Started, 1);
      store.getActions().network.setNetworks([network]);

      const args: MintTapAssetArgs = {
        networkId: network.id,
        nodeName: network.nodes.tap[0].name,
        assetType: 'normal',
        name: 'TestAsset',
        amount: 0,
      };

      await expect(store.getActions().mcp.mintTapAsset(args)).rejects.toThrow(
        'Amount must be greater than 0',
      );
    });

    it('should throw error if decimals is negative', async () => {
      const network = getNetwork(1, 'test', Status.Started, 1);
      store.getActions().network.setNetworks([network]);

      const args: MintTapAssetArgs = {
        networkId: network.id,
        nodeName: network.nodes.tap[0].name,
        assetType: 'normal',
        name: 'TestAsset',
        amount: 100,
        decimals: -1,
      };

      await expect(store.getActions().mcp.mintTapAsset(args)).rejects.toThrow(
        'Decimals must be between 0 and 8',
      );
    });

    it('should throw error if decimals is greater than 8', async () => {
      const network = getNetwork(1, 'test', Status.Started, 1);
      store.getActions().network.setNetworks([network]);

      const args: MintTapAssetArgs = {
        networkId: network.id,
        nodeName: network.nodes.tap[0].name,
        assetType: 'normal',
        name: 'TestAsset',
        amount: 100,
        decimals: 9,
      };

      await expect(store.getActions().mcp.mintTapAsset(args)).rejects.toThrow(
        'Decimals must be between 0 and 8',
      );
    });

    it('should throw error if network not found', async () => {
      const network = getNetwork(1, 'test', Status.Started, 1);
      store.getActions().network.setNetworks([network]);

      const args: MintTapAssetArgs = {
        networkId: 99999,
        nodeName: 'tapd1',
        assetType: 'normal',
        name: 'TestAsset',
        amount: 100,
      };

      await expect(store.getActions().mcp.mintTapAsset(args)).rejects.toThrow(
        "Network with the id '99999' was not found.",
      );
    });

    it('should throw error if node not found', async () => {
      const network = getNetwork(1, 'test', Status.Started, 1);
      store.getActions().network.setNetworks([network]);

      const args: MintTapAssetArgs = {
        networkId: network.id,
        nodeName: 'nonexistent',
        assetType: 'normal',
        name: 'TestAsset',
        amount: 100,
      };

      await expect(store.getActions().mcp.mintTapAsset(args)).rejects.toThrow(
        'Tap node "nonexistent" not found in network',
      );
    });

    it('should handle mintAsset failure', async () => {
      const network = getNetwork(1, 'test', Status.Started, 1);
      store.getActions().network.setNetworks([network]);

      jest
        .spyOn(store.getActions().tap, 'mintAsset')
        .mockRejectedValue(new Error('Failed to mint asset'));

      const args: MintTapAssetArgs = {
        networkId: network.id,
        nodeName: network.nodes.tap[0].name,
        assetType: 'normal',
        name: 'TestAsset',
        amount: 100,
      };

      await expect(store.getActions().mcp.mintTapAsset(args)).rejects.toThrow(
        'Failed to mint asset',
      );
    });

    it('should mint assets with different decimals correctly', async () => {
      const network = getNetwork(1, 'test', Status.Started, 1);
      store.getActions().network.setNetworks([network]);

      const spy = jest
        .spyOn(store.getActions().tap, 'mintAsset')
        .mockResolvedValue({ pendingBatch: { batchKey: 'batch' } } as any);

      const testDecimals = [0, 2, 4, 8];

      for (const decimals of testDecimals) {
        const args: MintTapAssetArgs = {
          networkId: network.id,
          nodeName: network.nodes.tap[0].name,
          assetType: 'normal',
          name: `Asset${decimals}`,
          amount: 1000,
          decimals,
        };

        const result = await store.getActions().mcp.mintTapAsset(args);

        expect(result.success).toBe(true);
        expect(spy).toHaveBeenCalledWith(
          expect.objectContaining({
            decimals,
          }),
        );
      }
    });

    it('should mint assets with different amounts correctly', async () => {
      const network = getNetwork(1, 'test', Status.Started, 1);
      store.getActions().network.setNetworks([network]);

      const spy = jest
        .spyOn(store.getActions().tap, 'mintAsset')
        .mockResolvedValue({ pendingBatch: { batchKey: 'batch' } } as any);

      const testAmounts = [1, 100, 10000, 1000000];

      for (const amount of testAmounts) {
        const args: MintTapAssetArgs = {
          networkId: network.id,
          nodeName: network.nodes.tap[0].name,
          assetType: 'normal',
          name: 'TestAsset',
          amount,
        };

        const result = await store.getActions().mcp.mintTapAsset(args);

        expect(result.success).toBe(true);
        expect(result.amount).toBe(amount);
        expect(spy).toHaveBeenCalledWith(
          expect.objectContaining({
            amount,
          }),
        );
      }
    });

    it('should handle emission enabled flag', async () => {
      const network = getNetwork(1, 'test', Status.Started, 1);
      store.getActions().network.setNetworks([network]);

      const spy = jest
        .spyOn(store.getActions().tap, 'mintAsset')
        .mockResolvedValue({ pendingBatch: { batchKey: 'batch' } } as any);

      const args: MintTapAssetArgs = {
        networkId: network.id,
        nodeName: network.nodes.tap[0].name,
        assetType: 'normal',
        name: 'TestAsset',
        amount: 100,
        enableEmission: true,
      };

      await store.getActions().mcp.mintTapAsset(args);

      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({
          enableEmission: true,
        }),
      );
    });

    it('should handle finalize flag', async () => {
      const network = getNetwork(1, 'test', Status.Started, 1);
      store.getActions().network.setNetworks([network]);

      const spy = jest
        .spyOn(store.getActions().tap, 'mintAsset')
        .mockResolvedValue({ pendingBatch: { batchKey: 'batch' } } as any);

      const args: MintTapAssetArgs = {
        networkId: network.id,
        nodeName: network.nodes.tap[0].name,
        assetType: 'normal',
        name: 'TestAsset',
        amount: 100,
        finalize: false,
      };

      await store.getActions().mcp.mintTapAsset(args);

      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({
          finalize: false,
        }),
      );
    });

    it('should handle autoFund flag', async () => {
      const network = getNetwork(1, 'test', Status.Started, 1);
      store.getActions().network.setNetworks([network]);

      const spy = jest
        .spyOn(store.getActions().tap, 'mintAsset')
        .mockResolvedValue({ pendingBatch: { batchKey: 'batch' } } as any);

      const args: MintTapAssetArgs = {
        networkId: network.id,
        nodeName: network.nodes.tap[0].name,
        assetType: 'normal',
        name: 'TestAsset',
        amount: 100,
        autoFund: false,
      };

      await store.getActions().mcp.mintTapAsset(args);

      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({
          autoFund: false,
        }),
      );
    });

    it('should mint asset on a litd node', async () => {
      const network = getNetwork(1, 'test', Status.Started);
      const litdNode = createLitdNetworkNode(
        network,
        testRepoState.images.litd.latest,
        testRepoState.images.litd.compatibility,
        testNodeDocker,
      );

      network.nodes.lightning.push(litdNode);
      store.getActions().network.setNetworks([network]);

      // Mock lightning service methods for litd node
      lightningServiceMock.getNewAddress.mockResolvedValue({ address: 'bc1q123' } as any);

      const spy = jest.spyOn(store.getActions().tap, 'mintAsset');
      tapServiceMock.mintAsset.mockResolvedValue({
        pendingBatch: { batchKey: 'litd-batch123' },
      } as any);

      const args: MintTapAssetArgs = {
        networkId: network.id,
        nodeName: litdNode.name,
        assetType: 'normal',
        name: 'LitdAsset',
        amount: 500,
      };

      const result = await store.getActions().mcp.mintTapAsset(args);

      expect(result.success).toBe(true);
      expect(result.message).toContain(
        `Minted normal asset "LitdAsset" on node "${litdNode.name}"`,
      );
      expect(result.nodeName).toBe(litdNode.name);
      expect(result.batchKey).toBe('litd-batch123');
      expect(spy).toHaveBeenCalledWith({
        node: expect.objectContaining({ name: litdNode.name }),
        assetType: TAP_ASSET_TYPE.NORMAL,
        name: 'LitdAsset',
        amount: 500,
        decimals: 0,
        enableEmission: false,
        finalize: true,
        autoFund: true,
      });
    });
  });
});
