import { createStore } from 'easy-peasy';
import { Status } from 'shared/types';
import { createLitdNetworkNode } from 'utils/network';
import {
  createMockRootModel,
  getNetwork,
  injections,
  tapServiceMock,
  testNodeDocker,
  testRepoState,
} from 'utils/tests';
import { ListTapAssetsArgs, listTapAssetsDefinition } from './listTapAssets';

jest.mock('electron-log');

describe('listTapAssets Tool', () => {
  const rootModel = createMockRootModel();

  // initialize store for type inference
  let store = createStore(rootModel, { injections });

  beforeEach(() => {
    // reset the store before each test run
    store = createStore(rootModel, { injections });
  });

  describe('listTapAssetsDefinition', () => {
    it('should have correct name', () => {
      expect(listTapAssetsDefinition.name).toBe('list_tap_assets');
    });

    it('should have a description', () => {
      expect(listTapAssetsDefinition.description).toBeTruthy();
      expect(listTapAssetsDefinition.description).toContain('List all Taproot Assets');
    });

    it('should have input schema with required fields', () => {
      expect(listTapAssetsDefinition.inputSchema.type).toBe('object');
      expect(listTapAssetsDefinition.inputSchema.properties).toHaveProperty('networkId');
      expect(listTapAssetsDefinition.inputSchema.properties).toHaveProperty('nodeName');
      expect(listTapAssetsDefinition.inputSchema.required).toEqual([
        'networkId',
        'nodeName',
      ]);
    });
  });

  describe('listTapAssetsTool', () => {
    it('should list assets for specific node successfully', async () => {
      const network = getNetwork(1, 'test', Status.Started, 1);
      const nodeName = network.nodes.tap[0].name;
      store.getActions().network.setNetworks([network]);

      const mockAsset = {
        id: 'asset1',
        name: 'TestAsset1',
        type: 'NORMAL',
        amount: '1000',
        genesisPoint: 'genesis1',
        anchorOutpoint: 'anchor1',
        groupKey: 'group1',
        decimals: 2,
      };

      const mockAssetRoots = [{ id: 'asset1', name: 'TestAsset1', rootSum: 1000 }];

      jest.spyOn(store.getActions().tap, 'getAssets').mockImplementation(() => {
        store.getActions().tap.setAssets({
          node: network.nodes.tap[0],
          assets: [mockAsset],
        });
        store.getActions().tap.setAssetRoots({
          node: network.nodes.tap[0],
          roots: mockAssetRoots,
        });
        return Promise.resolve();
      });

      const args: ListTapAssetsArgs = {
        networkId: network.id,
        nodeName,
      };

      const result = await store.getActions().mcp.listTapAssets(args);

      expect(result.networkId).toBe(network.id);
      expect(result.assets).toHaveLength(1);
      expect(result.totalCount).toBe(1);
      expect(result.assets[0]).toEqual({
        id: 'asset1',
        name: 'TestAsset1',
        type: 'NORMAL',
        amount: '1000',
        genesisPoint: 'genesis1',
        anchorOutpoint: 'anchor1',
        groupKey: 'group1',
        decimals: 2,
        nodeName,
      });
    });

    it('should return empty list when no assets exist', async () => {
      const network = getNetwork(1, 'test', Status.Started, 1);
      store.getActions().network.setNetworks([network]);

      tapServiceMock.listAssets.mockResolvedValue(undefined as any);

      const args: ListTapAssetsArgs = {
        networkId: network.id,
        nodeName: network.nodes.tap[0].name,
      };

      const result = await store.getActions().mcp.listTapAssets(args);

      expect(result.networkId).toBe(network.id);
      expect(result.assets).toEqual([]);
      expect(result.totalCount).toBe(0);
    });

    it('should throw error if networkId is missing', async () => {
      const args = {
        nodeName: 'tapd1',
      } as any;

      await expect(store.getActions().mcp.listTapAssets(args)).rejects.toThrow(
        'Network ID is required',
      );
    });

    it('should throw error if nodeName is missing', async () => {
      const network = getNetwork(1, 'test', Status.Started, 1);
      store.getActions().network.setNetworks([network]);

      const args = {
        networkId: network.id,
      } as any;

      await expect(store.getActions().mcp.listTapAssets(args)).rejects.toThrow(
        'Node name is required',
      );
    });

    it('should throw error if network not found', async () => {
      const network = getNetwork(1, 'test', Status.Started, 1);
      store.getActions().network.setNetworks([network]);

      const args: ListTapAssetsArgs = {
        networkId: 99999,
        nodeName: 'tapd1',
      };

      await expect(store.getActions().mcp.listTapAssets(args)).rejects.toThrow(
        "Network with the id '99999' was not found.",
      );
    });

    it('should throw error if node not found', async () => {
      const network = getNetwork(1, 'test', Status.Started, 1);
      store.getActions().network.setNetworks([network]);

      const args: ListTapAssetsArgs = {
        networkId: network.id,
        nodeName: 'nonexistent',
      };

      await expect(store.getActions().mcp.listTapAssets(args)).rejects.toThrow(
        'Tap node "nonexistent" not found in network',
      );
    });

    it('should handle getAssets failure', async () => {
      const network = getNetwork(1, 'test', Status.Started, 1);
      store.getActions().network.setNetworks([network]);

      jest
        .spyOn(store.getActions().tap, 'getAssets')
        .mockRejectedValue(new Error('Failed to get assets'));

      const args: ListTapAssetsArgs = {
        networkId: network.id,
        nodeName: network.nodes.tap[0].name,
      };

      await expect(store.getActions().mcp.listTapAssets(args)).rejects.toThrow(
        'Failed to get assets',
      );
    });

    it('should include all asset details in response', async () => {
      const network = getNetwork(1, 'test', Status.Started, 1);
      const nodeName = network.nodes.tap[0].name;
      store.getActions().network.setNetworks([network]);

      const mockAsset = {
        id: 'detailed-asset',
        name: 'DetailedAsset',
        type: 'NORMAL',
        amount: '5000',
        genesisPoint: 'genesis-detailed',
        anchorOutpoint: 'anchor-detailed',
        groupKey: 'group-detailed',
        decimals: 4,
      };

      jest.spyOn(store.getActions().tap, 'getAssets').mockImplementation(() => {
        store.getActions().tap.setAssets({
          node: network.nodes.tap[0],
          assets: [mockAsset],
        });
        store.getActions().tap.setAssetRoots({
          node: network.nodes.tap[0],
          roots: [{ id: mockAsset.id, name: mockAsset.name, rootSum: 5000 }],
        });
        return Promise.resolve();
      });

      const args: ListTapAssetsArgs = {
        networkId: network.id,
        nodeName,
      };

      const result = await store.getActions().mcp.listTapAssets(args);

      expect(result.assets).toHaveLength(1);
      const asset = result.assets[0];
      expect(asset.id).toBe('detailed-asset');
      expect(asset.name).toBe('DetailedAsset');
      expect(asset.type).toBe('NORMAL');
      expect(asset.amount).toBe('5000');
      expect(asset.genesisPoint).toBe('genesis-detailed');
      expect(asset.anchorOutpoint).toBe('anchor-detailed');
      expect(asset.groupKey).toBe('group-detailed');
      expect(asset.decimals).toBe(4);
      expect(asset.nodeName).toBe(nodeName);
    });

    it('should handle multiple assets on same node', async () => {
      const network = getNetwork(1, 'test', Status.Started, 1);
      const nodeName = network.nodes.tap[0].name;
      store.getActions().network.setNetworks([network]);

      const mockAssets = [
        {
          id: 'asset1',
          name: 'Asset1',
          type: 'NORMAL',
          amount: '1000',
          genesisPoint: 'g1',
          anchorOutpoint: 'a1',
          groupKey: 'gr1',
          decimals: 2,
        },
        {
          id: 'asset2',
          name: 'Asset2',
          type: 'NORMAL',
          amount: '2000',
          genesisPoint: 'g2',
          anchorOutpoint: 'a2',
          groupKey: 'gr2',
          decimals: 0,
        },
        {
          id: 'asset3',
          name: 'Asset3',
          type: 'COLLECTIBLE',
          amount: '1',
          genesisPoint: 'g3',
          anchorOutpoint: 'a3',
          groupKey: 'gr3',
          decimals: 0,
        },
      ];

      jest.spyOn(store.getActions().tap, 'getAssets').mockImplementation(() => {
        store.getActions().tap.setAssets({
          node: network.nodes.tap[0],
          assets: mockAssets,
        });
        store.getActions().tap.setAssetRoots({
          node: network.nodes.tap[0],
          roots: [
            { id: 'asset1', name: 'Asset1', rootSum: 1000 },
            { id: 'asset2', name: 'Asset2', rootSum: 2000 },
            { id: 'asset3', name: 'Asset3', rootSum: 1 },
          ],
        });
        return Promise.resolve();
      });

      const args: ListTapAssetsArgs = {
        networkId: network.id,
        nodeName,
      };

      const result = await store.getActions().mcp.listTapAssets(args);

      expect(result.assets).toHaveLength(3);
      expect(result.totalCount).toBe(3);
      expect(result.assets.map((a: any) => a.id)).toEqual(['asset1', 'asset2', 'asset3']);
    });

    it('should list assets for a litd node', async () => {
      const network = getNetwork(1, 'test', Status.Started);
      const litdNode = createLitdNetworkNode(
        network,
        testRepoState.images.litd.latest,
        testRepoState.images.litd.compatibility,
        testNodeDocker,
      );
      network.nodes.lightning.push(litdNode);
      store.getActions().network.setNetworks([network]);

      const mockAsset = {
        id: 'litd-asset1',
        name: 'LitdAsset1',
        type: 'NORMAL',
        amount: '3000',
        genesisPoint: 'genesis-litd',
        anchorOutpoint: 'anchor-litd',
        groupKey: 'group-litd',
        decimals: 0,
      };

      jest.spyOn(store.getActions().tap, 'getAssets').mockImplementation((node: any) => {
        if (node.name === litdNode.name) {
          store.getActions().tap.setAssets({
            node,
            assets: [mockAsset],
          });
          store.getActions().tap.setAssetRoots({
            node,
            roots: [{ id: 'litd-asset1', name: 'LitdAsset1', rootSum: 3000 }],
          });
        }
        return Promise.resolve();
      });

      const args: ListTapAssetsArgs = {
        networkId: network.id,
        nodeName: litdNode.name,
      };

      const result = await store.getActions().mcp.listTapAssets(args);

      expect(result.networkId).toBe(network.id);
      expect(result.assets).toHaveLength(1);
      expect(result.totalCount).toBe(1);
      expect(result.assets[0]).toEqual({
        id: 'litd-asset1',
        name: 'LitdAsset1',
        type: 'NORMAL',
        amount: '3000',
        genesisPoint: 'genesis-litd',
        anchorOutpoint: 'anchor-litd',
        groupKey: 'group-litd',
        decimals: 0,
        nodeName: litdNode.name,
      });
    });
  });
});
