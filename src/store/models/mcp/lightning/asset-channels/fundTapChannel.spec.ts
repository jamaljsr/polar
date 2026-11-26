import { createStore } from 'easy-peasy';
import {
  createMockRootModel,
  injections,
  lightningServiceMock,
  tapServiceMock,
} from 'utils/tests';
import { FundTapChannelArgs, fundTapChannelDefinition } from './fundTapChannel';

jest.mock('electron-log');

describe('fundTapChannel Tool', () => {
  const rootModel = createMockRootModel();

  // initialize store for type inference
  let store = createStore(rootModel, { injections });

  beforeEach(() => {
    // reset the store before each test run
    store = createStore(rootModel, { injections });
  });

  describe('fundTapChannelDefinition', () => {
    it('should have correct name', () => {
      expect(fundTapChannelDefinition.name).toBe('fund_tap_channel');
    });

    it('should have a description', () => {
      expect(fundTapChannelDefinition.description).toBeTruthy();
      expect(fundTapChannelDefinition.description).toContain(
        'Fund a Lightning Network channel',
      );
      expect(fundTapChannelDefinition.description).toContain('Taproot Assets');
      expect(fundTapChannelDefinition.description).toContain('litd nodes only');
    });

    it('should have input schema with required fields', () => {
      expect(fundTapChannelDefinition.inputSchema.type).toBe('object');
      expect(fundTapChannelDefinition.inputSchema.properties).toHaveProperty('networkId');
      expect(fundTapChannelDefinition.inputSchema.properties).toHaveProperty('fromNode');
      expect(fundTapChannelDefinition.inputSchema.properties).toHaveProperty('toNode');
      expect(fundTapChannelDefinition.inputSchema.properties).toHaveProperty('assetId');
      expect(fundTapChannelDefinition.inputSchema.properties).toHaveProperty('amount');
      expect(fundTapChannelDefinition.inputSchema.required).toEqual([
        'networkId',
        'fromNode',
        'toNode',
        'assetId',
        'amount',
      ]);
    });

    it('should validate amount minimum', () => {
      const amountProperty = fundTapChannelDefinition.inputSchema.properties.amount;
      expect(amountProperty.minimum).toBe(1);
    });
  });

  describe('fundTapChannelTool', () => {
    const args: FundTapChannelArgs = {
      networkId: 1,
      fromNode: 'alice-litd',
      toNode: 'bob-litd',
      assetId: 'abc123',
      amount: 1000,
    };

    beforeEach(() => {
      jest.clearAllMocks();
      lightningServiceMock.getInfo.mockResolvedValue({
        pubkey: '02abcd1234',
        alias: 'test-node',
        rpcUrl: 'test-node@localhost:9735',
        syncedToChain: true,
        blockHeight: 100,
        numPendingChannels: 0,
        numActiveChannels: 0,
        numInactiveChannels: 0,
      });

      // Mock the tap store actions
      jest.spyOn(store.getActions().tap, 'syncUniverse').mockResolvedValue(0);
      jest.spyOn(store.getActions().bitcoin, 'mine').mockResolvedValue(undefined);
      jest.spyOn(store.getActions().designer, 'syncChart').mockResolvedValue(undefined);

      // fundChannel is a void function, no need to mock return value
    });

    it('should fund a Tap channel successfully', async () => {
      // Create a network with 2 litd nodes
      await store.getActions().network.addNetwork({
        name: 'test-network',
        description: 'Test',
        lndNodes: 0,
        clightningNodes: 0,
        eclairNodes: 0,
        bitcoindNodes: 1,
        btcdNodes: 0,
        tapdNodes: 0,
        litdNodes: 2,
        customNodes: {},
        manualMineCount: 6,
      });

      const network = store.getState().network.networks[0];
      const fromNode = network.nodes.lightning[0].name;
      const toNode = network.nodes.lightning[1].name;
      const assetId = 'test-asset-id';

      const result = await store.getActions().mcp.fundTapChannel({
        networkId: network.id,
        fromNode,
        toNode,
        assetId,
        amount: 50000,
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain('Funded Tap channel');
      expect(result.message).toContain(fromNode);
      expect(result.message).toContain(toNode);
      expect(result.message).toContain('50000 units');
      expect(result.message).toContain(assetId);
      expect(result.networkId).toBe(network.id);
      expect(result.fromNode).toBe(fromNode);
      expect(result.toNode).toBe(toNode);
      expect(result.assetId).toBe(assetId);
      expect(result.amount).toBe(50000);
    });

    it('should throw an error for invalid network ID', async () => {
      await expect(
        store.getActions().mcp.fundTapChannel({
          ...args,
          networkId: 999,
        }),
      ).rejects.toThrow("Network with the id '999' was not found.");
    });

    it('should throw an error for missing network ID', async () => {
      await expect(
        store.getActions().mcp.fundTapChannel({
          ...args,
          networkId: undefined as any,
        }),
      ).rejects.toThrow('Network ID is required');
    });

    it('should throw an error for missing from node name', async () => {
      await store.getActions().network.addNetwork({
        name: 'test-network',
        description: 'Test',
        lndNodes: 0,
        clightningNodes: 0,
        eclairNodes: 0,
        bitcoindNodes: 1,
        btcdNodes: 0,
        tapdNodes: 0,
        litdNodes: 2,
        customNodes: {},
        manualMineCount: 6,
      });

      const network = store.getState().network.networks[0];

      await expect(
        store.getActions().mcp.fundTapChannel({
          ...args,
          networkId: network.id,
          fromNode: '',
        }),
      ).rejects.toThrow('From node name is required');
    });

    it('should throw an error for missing to node name', async () => {
      await store.getActions().network.addNetwork({
        name: 'test-network',
        description: 'Test',
        lndNodes: 0,
        clightningNodes: 0,
        eclairNodes: 0,
        bitcoindNodes: 1,
        btcdNodes: 0,
        tapdNodes: 0,
        litdNodes: 2,
        customNodes: {},
        manualMineCount: 6,
      });

      const network = store.getState().network.networks[0];

      await expect(
        store.getActions().mcp.fundTapChannel({
          ...args,
          networkId: network.id,
          toNode: '',
        }),
      ).rejects.toThrow('To node name is required');
    });

    it('should throw an error for missing asset ID', async () => {
      await store.getActions().network.addNetwork({
        name: 'test-network',
        description: 'Test',
        lndNodes: 0,
        clightningNodes: 0,
        eclairNodes: 0,
        bitcoindNodes: 1,
        btcdNodes: 0,
        tapdNodes: 0,
        litdNodes: 2,
        customNodes: {},
        manualMineCount: 6,
      });

      const network = store.getState().network.networks[0];

      await expect(
        store.getActions().mcp.fundTapChannel({
          ...args,
          networkId: network.id,
          assetId: '',
        }),
      ).rejects.toThrow('Asset ID is required');
    });

    it('should throw an error for invalid amount', async () => {
      await store.getActions().network.addNetwork({
        name: 'test-network',
        description: 'Test',
        lndNodes: 0,
        clightningNodes: 0,
        eclairNodes: 0,
        bitcoindNodes: 1,
        btcdNodes: 0,
        tapdNodes: 0,
        litdNodes: 2,
        customNodes: {},
        manualMineCount: 6,
      });

      const network = store.getState().network.networks[0];

      await expect(
        store.getActions().mcp.fundTapChannel({
          ...args,
          networkId: network.id,
          amount: 0,
        }),
      ).rejects.toThrow('Amount must be greater than 0');
    });

    it('should throw an error for from node not found', async () => {
      await store.getActions().network.addNetwork({
        name: 'test-network',
        description: 'Test',
        lndNodes: 0,
        clightningNodes: 0,
        eclairNodes: 0,
        bitcoindNodes: 1,
        btcdNodes: 0,
        tapdNodes: 0,
        litdNodes: 1,
        customNodes: {},
        manualMineCount: 6,
      });

      const network = store.getState().network.networks[0];

      await expect(
        store.getActions().mcp.fundTapChannel({
          ...args,
          networkId: network.id,
          fromNode: 'non-existent-node',
        }),
      ).rejects.toThrow('Tap node "non-existent-node" not found in network');
    });

    it('should throw an error for to node not found', async () => {
      await store.getActions().network.addNetwork({
        name: 'test-network',
        description: 'Test',
        lndNodes: 0,
        clightningNodes: 0,
        eclairNodes: 0,
        bitcoindNodes: 1,
        btcdNodes: 0,
        tapdNodes: 0,
        litdNodes: 1,
        customNodes: {},
        manualMineCount: 6,
      });

      const network = store.getState().network.networks[0];
      const fromNode = network.nodes.lightning[0].name;

      await expect(
        store.getActions().mcp.fundTapChannel({
          ...args,
          networkId: network.id,
          fromNode,
          toNode: 'non-existent-node',
        }),
      ).rejects.toThrow('Lightning node "non-existent-node" not found in network');
    });

    it('should throw an error for same from and to node', async () => {
      await store.getActions().network.addNetwork({
        name: 'test-network',
        description: 'Test',
        lndNodes: 0,
        clightningNodes: 0,
        eclairNodes: 0,
        bitcoindNodes: 1,
        btcdNodes: 0,
        tapdNodes: 0,
        litdNodes: 2,
        customNodes: {},
        manualMineCount: 6,
      });

      const network = store.getState().network.networks[0];
      const nodeName = network.nodes.lightning[0].name;

      await expect(
        store.getActions().mcp.fundTapChannel({
          ...args,
          networkId: network.id,
          fromNode: nodeName,
          toNode: nodeName,
        }),
      ).rejects.toThrow('Cannot fund channel between the same node');
    });

    it('should call tap.fundChannel with correct parameters', async () => {
      await store.getActions().network.addNetwork({
        name: 'test-network',
        description: 'Test',
        lndNodes: 0,
        clightningNodes: 0,
        eclairNodes: 0,
        bitcoindNodes: 1,
        btcdNodes: 0,
        tapdNodes: 0,
        litdNodes: 2,
        customNodes: {},
        manualMineCount: 6,
      });

      const network = store.getState().network.networks[0];
      const fromNode = network.nodes.lightning[0].name;
      const toNode = network.nodes.lightning[1].name;
      const assetId = 'test-asset-id';
      const amount = 12345;

      await store.getActions().mcp.fundTapChannel({
        networkId: network.id,
        fromNode,
        toNode,
        assetId,
        amount,
      });

      // fundChannel is called with the mapped TapNode from findTapNode
      expect(tapServiceMock.fundChannel).toHaveBeenCalledWith(
        expect.objectContaining({
          name: fromNode,
          type: 'tap',
          implementation: 'litd',
        }),
        '02abcd1234',
        assetId,
        amount,
      );
    });
  });
});
