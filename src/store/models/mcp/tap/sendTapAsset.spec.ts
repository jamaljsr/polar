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
import { SendTapAssetArgs, sendTapAssetDefinition } from './sendTapAsset';

jest.mock('electron-log');

describe('sendTapAsset Tool', () => {
  const rootModel = createMockRootModel();

  // initialize store for type inference
  let store = createStore(rootModel, { injections });

  beforeEach(() => {
    // reset the store before each test run
    store = createStore(rootModel, { injections });
  });

  describe('sendTapAssetDefinition', () => {
    it('should have correct name', () => {
      expect(sendTapAssetDefinition.name).toBe('send_tap_asset');
    });

    it('should have a description', () => {
      expect(sendTapAssetDefinition.description).toBeTruthy();
      expect(sendTapAssetDefinition.description).toContain('Send a Taproot Asset');
    });

    it('should have input schema with required fields', () => {
      expect(sendTapAssetDefinition.inputSchema.type).toBe('object');
      expect(sendTapAssetDefinition.inputSchema.properties).toHaveProperty('networkId');
      expect(sendTapAssetDefinition.inputSchema.properties).toHaveProperty('fromNode');
      expect(sendTapAssetDefinition.inputSchema.properties).toHaveProperty('address');
      expect(sendTapAssetDefinition.inputSchema.required).toEqual([
        'networkId',
        'fromNode',
        'address',
      ]);
    });

    it('should have optional parameters', () => {
      expect(sendTapAssetDefinition.inputSchema.properties).toHaveProperty('autoFund');
    });
  });

  describe('sendTapAssetTool', () => {
    it('should send asset successfully', async () => {
      const network = getNetwork(1, 'test', Status.Started, 1);
      store.getActions().network.setNetworks([network]);

      const spy = jest
        .spyOn(store.getActions().tap, 'sendAsset')
        .mockResolvedValue({ transfer: { id: 'transfer123' } } as any);

      const args: SendTapAssetArgs = {
        networkId: network.id,
        fromNode: network.nodes.tap[0].name,
        address: 'tap1address',
        autoFund: true,
      };

      const result = await store.getActions().mcp.sendTapAsset(args);

      expect(result.success).toBe(true);
      expect(result.message).toContain(
        `Sent Taproot Asset to address ${args.address} from node "${args.fromNode}"`,
      );
      expect(result.networkId).toBe(network.id);
      expect(result.fromNode).toBe(network.nodes.tap[0].name);
      expect(result.address).toBe('tap1address');
      expect(result.transfer).toEqual({ transfer: { id: 'transfer123' } });
      expect(spy).toHaveBeenCalledWith({
        node: expect.objectContaining({ name: network.nodes.tap[0].name }),
        address: 'tap1address',
        autoFund: true,
      });
    });

    it('should use default values for optional parameters', async () => {
      const network = getNetwork(1, 'test', Status.Started, 1);
      store.getActions().network.setNetworks([network]);

      const spy = jest
        .spyOn(store.getActions().tap, 'sendAsset')
        .mockResolvedValue({ transfer: { id: 'transfer456' } } as any);

      const args: SendTapAssetArgs = {
        networkId: network.id,
        fromNode: network.nodes.tap[0].name,
        address: 'tap1address',
      };

      await store.getActions().mcp.sendTapAsset(args);

      expect(spy).toHaveBeenCalledWith({
        node: expect.objectContaining({ name: network.nodes.tap[0].name }),
        address: 'tap1address',
        autoFund: true,
      });
    });

    it('should throw error if networkId is missing', async () => {
      const args = {
        fromNode: 'tapd1',
        address: 'tap1address',
      } as any;

      await expect(store.getActions().mcp.sendTapAsset(args)).rejects.toThrow(
        'Network ID is required',
      );
    });

    it('should throw error if fromNode is missing', async () => {
      const args = {
        networkId: 1,
        address: 'tap1address',
      } as any;

      await expect(store.getActions().mcp.sendTapAsset(args)).rejects.toThrow(
        'From node name is required',
      );
    });

    it('should throw error if address is missing', async () => {
      const network = getNetwork(1, 'test', Status.Started, 1);
      store.getActions().network.setNetworks([network]);

      const args = {
        networkId: network.id,
        fromNode: network.nodes.tap[0].name,
      } as any;

      await expect(store.getActions().mcp.sendTapAsset(args)).rejects.toThrow(
        'Address is required',
      );
    });

    it('should throw error if network not found', async () => {
      const network = getNetwork(1, 'test', Status.Started, 1);
      store.getActions().network.setNetworks([network]);

      const args: SendTapAssetArgs = {
        networkId: 99999,
        fromNode: 'tapd1',
        address: 'tap1address',
      };

      await expect(store.getActions().mcp.sendTapAsset(args)).rejects.toThrow(
        "Network with the id '99999' was not found.",
      );
    });

    it('should throw error if node not found', async () => {
      const network = getNetwork(1, 'test', Status.Started, 1);
      store.getActions().network.setNetworks([network]);

      const args: SendTapAssetArgs = {
        networkId: network.id,
        fromNode: 'nonexistent',
        address: 'tap1address',
      };

      await expect(store.getActions().mcp.sendTapAsset(args)).rejects.toThrow(
        'Tap node "nonexistent" not found in network',
      );
    });

    it('should handle sendAsset failure', async () => {
      const network = getNetwork(1, 'test', Status.Started, 1);
      store.getActions().network.setNetworks([network]);

      jest
        .spyOn(store.getActions().tap, 'sendAsset')
        .mockRejectedValue(new Error('Failed to send asset'));

      const args: SendTapAssetArgs = {
        networkId: network.id,
        fromNode: network.nodes.tap[0].name,
        address: 'tap1address',
      };

      await expect(store.getActions().mcp.sendTapAsset(args)).rejects.toThrow(
        'Failed to send asset',
      );
    });

    it('should send asset from a litd node', async () => {
      const network = getNetwork(1, 'test', Status.Started);
      const litdNode = createLitdNetworkNode(
        network,
        testRepoState.images.litd.latest,
        testRepoState.images.litd.compatibility,
        testNodeDocker,
      );
      network.nodes.lightning.push(litdNode);
      store.getActions().network.setNetworks([network]);

      const spy = jest
        .spyOn(store.getActions().tap, 'sendAsset')
        .mockResolvedValue({ transfer: { id: 'litd-transfer123' } } as any);

      const args: SendTapAssetArgs = {
        networkId: network.id,
        fromNode: litdNode.name,
        address: 'tap1address-litd',
      };

      const result = await store.getActions().mcp.sendTapAsset(args);

      expect(result.success).toBe(true);
      expect(result.message).toContain(
        `Sent Taproot Asset to address tap1address-litd from node "${litdNode.name}"`,
      );
      expect(result.fromNode).toBe(litdNode.name);
      expect(result.transfer).toEqual({ transfer: { id: 'litd-transfer123' } });
      expect(spy).toHaveBeenCalledWith({
        node: expect.objectContaining({ name: litdNode.name }),
        address: 'tap1address-litd',
        autoFund: true,
      });
    });
  });
});
