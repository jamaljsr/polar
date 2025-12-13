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
  CreateAssetInvoiceArgs,
  createAssetInvoiceDefinition,
} from './createAssetInvoice';

jest.mock('electron-log');

describe('createAssetInvoice Tool', () => {
  const rootModel = createMockRootModel();

  // initialize store for type inference
  let store = createStore(rootModel, { injections });

  beforeEach(() => {
    // reset the store before each test run
    store = createStore(rootModel, { injections });
  });

  describe('createAssetInvoiceDefinition', () => {
    it('should have correct name', () => {
      expect(createAssetInvoiceDefinition.name).toBe('create_asset_invoice');
    });

    it('should have a description', () => {
      expect(createAssetInvoiceDefinition.description).toBeTruthy();
      expect(createAssetInvoiceDefinition.description).toContain(
        'Create a Lightning invoice',
      );
      expect(createAssetInvoiceDefinition.description).toContain('Taproot Assets');
    });

    it('should have input schema with required fields', () => {
      expect(createAssetInvoiceDefinition.inputSchema.type).toBe('object');
      expect(createAssetInvoiceDefinition.inputSchema.properties).toHaveProperty(
        'networkId',
      );
      expect(createAssetInvoiceDefinition.inputSchema.properties).toHaveProperty(
        'nodeName',
      );
      expect(createAssetInvoiceDefinition.inputSchema.properties).toHaveProperty(
        'assetId',
      );
      expect(createAssetInvoiceDefinition.inputSchema.properties).toHaveProperty(
        'amount',
      );
      expect(createAssetInvoiceDefinition.inputSchema.required).toEqual([
        'networkId',
        'nodeName',
        'assetId',
        'amount',
      ]);
    });
  });

  describe('createAssetInvoiceTool', () => {
    it('should create asset invoice successfully', async () => {
      const network = getNetwork(1, 'test', Status.Started, 0);
      const litdNode = createLitdNetworkNode(
        network,
        testRepoState.images.litd.latest,
        testRepoState.images.litd.compatibility,
        testNodeDocker,
      );
      network.nodes.lightning.push(litdNode);
      store.getActions().network.setNetworks([network]);

      const spy = jest
        .spyOn(store.getActions().lit, 'createAssetInvoice')
        .mockResolvedValue({ invoice: 'lnbc123', sats: 1000 });

      const args: CreateAssetInvoiceArgs = {
        networkId: network.id,
        nodeName: litdNode.name,
        assetId: 'asset123',
        amount: 500,
      };

      const result = await store.getActions().mcp.createAssetInvoice(args);

      expect(result.success).toBe(true);
      expect(result.message).toContain(
        `Created asset invoice for 500 units of asset asset123 from node "${litdNode.name}"`,
      );
      expect(result.networkId).toBe(network.id);
      expect(result.nodeName).toBe(litdNode.name);
      expect(result.assetId).toBe('asset123');
      expect(result.amount).toBe(500);
      expect(result.invoice).toBe('lnbc123');
      expect(result.sats).toBe(1000);
      expect(spy).toHaveBeenCalledWith({
        node: expect.objectContaining({ name: litdNode.name }),
        assetId: 'asset123',
        amount: 500,
      });
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
        assetId: 'asset123',
        amount: 500,
      } as any;

      await expect(store.getActions().mcp.createAssetInvoice(args)).rejects.toThrow(
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
        assetId: 'asset123',
        amount: 500,
      } as any;

      await expect(store.getActions().mcp.createAssetInvoice(args)).rejects.toThrow(
        'Node name is required',
      );
    });

    it('should throw error if assetId is missing', async () => {
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
        nodeName: litdNode.name,
        amount: 500,
      } as any;

      await expect(store.getActions().mcp.createAssetInvoice(args)).rejects.toThrow(
        'Asset ID is required',
      );
    });

    it('should throw error if amount is invalid', async () => {
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
        nodeName: litdNode.name,
        assetId: 'asset123',
        amount: 0,
      };

      await expect(store.getActions().mcp.createAssetInvoice(args)).rejects.toThrow(
        'Amount must be greater than 0',
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

      const args: CreateAssetInvoiceArgs = {
        networkId: 99999,
        nodeName: 'litd1',
        assetId: 'asset123',
        amount: 500,
      };

      await expect(store.getActions().mcp.createAssetInvoice(args)).rejects.toThrow(
        "Network with the id '99999' was not found.",
      );
    });

    it('should throw error if node not found', async () => {
      const network = getNetwork(1, 'test', Status.Started, 0);
      store.getActions().network.setNetworks([network]);

      const args: CreateAssetInvoiceArgs = {
        networkId: network.id,
        nodeName: 'nonexistent',
        assetId: 'asset123',
        amount: 500,
      };

      await expect(store.getActions().mcp.createAssetInvoice(args)).rejects.toThrow(
        'Lightning node "nonexistent" not found in network',
      );
    });

    it('should throw error if node is not litd', async () => {
      const network = getNetwork(1, 'test', Status.Started, 0);
      store.getActions().network.setNetworks([network]);

      const args: CreateAssetInvoiceArgs = {
        networkId: network.id,
        nodeName: network.nodes.lightning[0].name, // This is LND, not litd
        assetId: 'asset123',
        amount: 500,
      };

      await expect(store.getActions().mcp.createAssetInvoice(args)).rejects.toThrow(
        `Node "${network.nodes.lightning[0].name}" is not a litd node`,
      );
    });

    it('should handle createAssetInvoice failure', async () => {
      const network = getNetwork(1, 'test', Status.Started, 0);
      const litdNode = createLitdNetworkNode(
        network,
        testRepoState.images.litd.latest,
        testRepoState.images.litd.compatibility,
        testNodeDocker,
      );
      network.nodes.lightning.push(litdNode);
      store.getActions().network.setNetworks([network]);

      jest
        .spyOn(store.getActions().lit, 'createAssetInvoice')
        .mockRejectedValue(new Error('Not enough assets in channel'));

      const args: CreateAssetInvoiceArgs = {
        networkId: network.id,
        nodeName: litdNode.name,
        assetId: 'asset123',
        amount: 500,
      };

      await expect(store.getActions().mcp.createAssetInvoice(args)).rejects.toThrow(
        'Not enough assets in channel',
      );
    });
  });
});
