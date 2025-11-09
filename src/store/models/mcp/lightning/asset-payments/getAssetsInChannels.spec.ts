import { createStore } from 'easy-peasy';
import { Status } from 'shared/types';
import { createLitdNetworkNode } from 'utils/network';
import {
  createMockRootModel,
  getNetwork,
  injections,
  testNodeDocker,
  testRepoState,
} from 'utils/tests';
import {
  GetAssetsInChannelsArgs,
  getAssetsInChannelsDefinition,
} from './getAssetsInChannels';

jest.mock('electron-log');

describe('getAssetsInChannels Tool', () => {
  const rootModel = createMockRootModel();

  // initialize store for type inference
  let store = createStore(rootModel, { injections });

  beforeEach(() => {
    // reset the store before each test run
    store = createStore(rootModel, { injections });
  });

  describe('getAssetsInChannelsDefinition', () => {
    it('should have correct name', () => {
      expect(getAssetsInChannelsDefinition.name).toBe('get_assets_in_channels');
    });

    it('should have a description', () => {
      expect(getAssetsInChannelsDefinition.description).toBeTruthy();
      expect(getAssetsInChannelsDefinition.description).toContain(
        'Get all Taproot Assets',
      );
      expect(getAssetsInChannelsDefinition.description).toContain('Lightning channels');
    });

    it('should have input schema with required fields', () => {
      expect(getAssetsInChannelsDefinition.inputSchema.type).toBe('object');
      expect(getAssetsInChannelsDefinition.inputSchema.properties).toHaveProperty(
        'networkId',
      );
      expect(getAssetsInChannelsDefinition.inputSchema.properties).toHaveProperty(
        'nodeName',
      );
      expect(getAssetsInChannelsDefinition.inputSchema.required).toEqual([
        'networkId',
        'nodeName',
      ]);
    });
  });

  describe('getAssetsInChannelsTool', () => {
    it('should get assets in channels successfully', async () => {
      const network = getNetwork(1, 'test', Status.Started, 0);
      const litdNode = createLitdNetworkNode(
        network,
        testRepoState.images.litd.latest,
        testRepoState.images.litd.compatibility,
        testNodeDocker,
      );
      network.nodes.lightning.push(litdNode);
      store.getActions().network.setNetworks([network]);

      const mockAssetsInChannels = [
        {
          asset: {
            id: 'asset123',
            name: 'Test Asset',
            capacity: '1000',
            localBalance: '500',
            remoteBalance: '500',
            decimals: 0,
          },
          peerPubkey: 'peer123',
        },
      ];
      const spy = (
        jest.spyOn(store.getActions().lit, 'getAssetsInChannels') as any
      ).mockResolvedValue(mockAssetsInChannels);

      const args: GetAssetsInChannelsArgs = {
        networkId: network.id,
        nodeName: litdNode.name,
      };

      const result = await store.getActions().mcp.getAssetsInChannels(args);

      expect(result.success).toBe(true);
      expect(result.message).toContain(
        `Retrieved 1 assets in channels for node "${litdNode.name}"`,
      );
      expect(result.networkId).toBe(network.id);
      expect(result.nodeName).toBe(litdNode.name);
      expect(result.assetsInChannels).toEqual(mockAssetsInChannels);
      expect(spy).toHaveBeenCalledWith({
        nodeName: litdNode.name,
      });
    });

    it('should return empty array when no assets in channels', async () => {
      const network = getNetwork(1, 'test', Status.Started, 0);
      const litdNode = createLitdNetworkNode(
        network,
        testRepoState.images.litd.latest,
        testRepoState.images.litd.compatibility,
        testNodeDocker,
      );
      network.nodes.lightning.push(litdNode);
      store.getActions().network.setNetworks([network]);

      (
        jest.spyOn(store.getActions().lit, 'getAssetsInChannels') as any
      ).mockResolvedValue([]);

      const args: GetAssetsInChannelsArgs = {
        networkId: network.id,
        nodeName: litdNode.name,
      };

      const result = await store.getActions().mcp.getAssetsInChannels(args);

      expect(result.success).toBe(true);
      expect(result.message).toContain(
        `Retrieved 0 assets in channels for node "${litdNode.name}"`,
      );
      expect(result.assetsInChannels).toEqual([]);
    });

    it('should throw error if networkId is missing', async () => {
      const network = getNetwork(1, 'test', Status.Started, 0);
      const litdNode = createLitdNetworkNode(
        network,
        testRepoState.images.litd.latest,
        testRepoState.images.litd.compatibility,
        testNodeDocker,
      );
      network.nodes.lightning.push(litdNode);
      store.getActions().network.setNetworks([network]);

      const args = {
        nodeName: litdNode.name,
      } as any;

      await expect(store.getActions().mcp.getAssetsInChannels(args)).rejects.toThrow(
        'Network ID is required',
      );
    });

    it('should throw error if nodeName is missing', async () => {
      const network = getNetwork(1, 'test', Status.Started, 0);
      const litdNode = createLitdNetworkNode(
        network,
        testRepoState.images.litd.latest,
        testRepoState.images.litd.compatibility,
        testNodeDocker,
      );
      network.nodes.lightning.push(litdNode);
      store.getActions().network.setNetworks([network]);

      const args = {
        networkId: network.id,
      } as any;

      await expect(store.getActions().mcp.getAssetsInChannels(args)).rejects.toThrow(
        'Node name is required',
      );
    });

    it('should throw error if network not found', async () => {
      const network = getNetwork(1, 'test', Status.Started, 0);
      const litdNode = createLitdNetworkNode(
        network,
        testRepoState.images.litd.latest,
        testRepoState.images.litd.compatibility,
        testNodeDocker,
      );
      network.nodes.lightning.push(litdNode);
      store.getActions().network.setNetworks([network]);

      const args: GetAssetsInChannelsArgs = {
        networkId: 99999,
        nodeName: 'litd1',
      };

      await expect(store.getActions().mcp.getAssetsInChannels(args)).rejects.toThrow(
        "Network with the id '99999' was not found.",
      );
    });

    it('should throw error if node not found', async () => {
      const network = getNetwork(1, 'test', Status.Started, 0);
      store.getActions().network.setNetworks([network]);

      const args: GetAssetsInChannelsArgs = {
        networkId: network.id,
        nodeName: 'nonexistent',
      };

      await expect(store.getActions().mcp.getAssetsInChannels(args)).rejects.toThrow(
        'Lightning node "nonexistent" not found in network',
      );
    });

    it('should throw error if node is not litd', async () => {
      const network = getNetwork(1, 'test', Status.Started, 0);
      store.getActions().network.setNetworks([network]);

      const args: GetAssetsInChannelsArgs = {
        networkId: network.id,
        nodeName: network.nodes.lightning[0].name, // This is LND, not litd
      };

      await expect(store.getActions().mcp.getAssetsInChannels(args)).rejects.toThrow(
        `Node "${network.nodes.lightning[0].name}" is not a litd node`,
      );
    });

    it('should handle getAssetsInChannels failure', async () => {
      const network = getNetwork(1, 'test', Status.Started, 0);
      const litdNode = createLitdNetworkNode(
        network,
        testRepoState.images.litd.latest,
        testRepoState.images.litd.compatibility,
        testNodeDocker,
      );
      network.nodes.lightning.push(litdNode);
      store.getActions().network.setNetworks([network]);

      (
        jest.spyOn(store.getActions().lit, 'getAssetsInChannels') as any
      ).mockRejectedValue(new Error('Database error'));

      const args: GetAssetsInChannelsArgs = {
        networkId: network.id,
        nodeName: litdNode.name,
      };

      await expect(store.getActions().mcp.getAssetsInChannels(args)).rejects.toThrow(
        'Database error',
      );
    });
  });
});
