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
import { PayAssetInvoiceArgs, payAssetInvoiceDefinition } from './payAssetInvoice';

jest.mock('electron-log');

describe('payAssetInvoice Tool', () => {
  const rootModel = createMockRootModel();

  // initialize store for type inference
  let store = createStore(rootModel, { injections });

  beforeEach(() => {
    // reset the store before each test run
    store = createStore(rootModel, { injections });
  });

  describe('payAssetInvoiceDefinition', () => {
    it('should have correct name', () => {
      expect(payAssetInvoiceDefinition.name).toBe('pay_asset_invoice');
    });

    it('should have a description', () => {
      expect(payAssetInvoiceDefinition.description).toBeTruthy();
      expect(payAssetInvoiceDefinition.description).toContain('Pay a Lightning invoice');
      expect(payAssetInvoiceDefinition.description).toContain('Taproot Assets');
    });

    it('should have input schema with required fields', () => {
      expect(payAssetInvoiceDefinition.inputSchema.type).toBe('object');
      expect(payAssetInvoiceDefinition.inputSchema.properties).toHaveProperty(
        'networkId',
      );
      expect(payAssetInvoiceDefinition.inputSchema.properties).toHaveProperty('fromNode');
      expect(payAssetInvoiceDefinition.inputSchema.properties).toHaveProperty('assetId');
      expect(payAssetInvoiceDefinition.inputSchema.properties).toHaveProperty('invoice');
      expect(payAssetInvoiceDefinition.inputSchema.required).toEqual([
        'networkId',
        'fromNode',
        'assetId',
        'invoice',
      ]);
    });
  });

  describe('payAssetInvoiceTool', () => {
    it('should pay asset invoice successfully', async () => {
      const network = getNetwork(1, 'test', Status.Started, 0);
      const litdNode = createLitdNetworkNode(
        network,
        testRepoState.images.litd.latest,
        testRepoState.images.litd.compatibility,
        testNodeDocker,
      );
      network.nodes.lightning.push(litdNode);
      store.getActions().network.setNetworks([network]);

      const mockReceipt = {
        preimage: 'preimage123',
        amount: 500,
        destination: 'dest123',
      };
      const spy = jest
        .spyOn(store.getActions().lit, 'payAssetInvoice')
        .mockResolvedValue(mockReceipt);

      const args: PayAssetInvoiceArgs = {
        networkId: network.id,
        fromNode: litdNode.name,
        assetId: 'asset123',
        invoice: 'lnbc123',
      };

      const result = await store.getActions().mcp.payAssetInvoice(args);

      expect(result.success).toBe(true);
      expect(result.message).toContain(
        `Paid asset invoice using asset asset123 from node "${litdNode.name}"`,
      );
      expect(result.networkId).toBe(network.id);
      expect(result.fromNode).toBe(litdNode.name);
      expect(result.assetId).toBe('asset123');
      expect(result.invoice).toBe('lnbc123');
      expect(result.receipt).toEqual(mockReceipt);
      expect(spy).toHaveBeenCalledWith({
        node: expect.objectContaining({ name: litdNode.name }),
        assetId: 'asset123',
        invoice: 'lnbc123',
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
        fromNode: litdNode.name,
        assetId: 'asset123',
        invoice: 'lnbc123',
      } as any;

      await expect(store.getActions().mcp.payAssetInvoice(args)).rejects.toThrow(
        'Network ID is required',
      );
    });

    it('should throw error if fromNode is missing', async () => {
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
        invoice: 'lnbc123',
      } as any;

      await expect(store.getActions().mcp.payAssetInvoice(args)).rejects.toThrow(
        'From node name is required',
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
        fromNode: litdNode.name,
        invoice: 'lnbc123',
      } as any;

      await expect(store.getActions().mcp.payAssetInvoice(args)).rejects.toThrow(
        'Asset ID is required',
      );
    });

    it('should throw error if invoice is missing', async () => {
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
        fromNode: litdNode.name,
        assetId: 'asset123',
      } as any;

      await expect(store.getActions().mcp.payAssetInvoice(args)).rejects.toThrow(
        'Invoice is required',
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

      const args: PayAssetInvoiceArgs = {
        networkId: 99999,
        fromNode: 'litd1',
        assetId: 'asset123',
        invoice: 'lnbc123',
      };

      await expect(store.getActions().mcp.payAssetInvoice(args)).rejects.toThrow(
        "Network with the id '99999' was not found.",
      );
    });

    it('should throw error if node not found', async () => {
      const network = getNetwork(1, 'test', Status.Started, 0);
      store.getActions().network.setNetworks([network]);

      const args: PayAssetInvoiceArgs = {
        networkId: network.id,
        fromNode: 'nonexistent',
        assetId: 'asset123',
        invoice: 'lnbc123',
      };

      await expect(store.getActions().mcp.payAssetInvoice(args)).rejects.toThrow(
        'Lightning node "nonexistent" not found in network',
      );
    });

    it('should throw error if node is not litd', async () => {
      const network = getNetwork(1, 'test', Status.Started, 0);
      store.getActions().network.setNetworks([network]);

      const args: PayAssetInvoiceArgs = {
        networkId: network.id,
        fromNode: network.nodes.lightning[0].name, // This is LND, not litd
        assetId: 'asset123',
        invoice: 'lnbc123',
      };

      await expect(store.getActions().mcp.payAssetInvoice(args)).rejects.toThrow(
        `Node "${network.nodes.lightning[0].name}" is not a litd node`,
      );
    });

    it('should handle payAssetInvoice failure', async () => {
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
        .spyOn(store.getActions().lit, 'payAssetInvoice')
        .mockRejectedValue(new Error('Not enough assets in channel'));

      const args: PayAssetInvoiceArgs = {
        networkId: network.id,
        fromNode: litdNode.name,
        assetId: 'asset123',
        invoice: 'lnbc123',
      };

      await expect(store.getActions().mcp.payAssetInvoice(args)).rejects.toThrow(
        'Not enough assets in channel',
      );
    });
  });
});
