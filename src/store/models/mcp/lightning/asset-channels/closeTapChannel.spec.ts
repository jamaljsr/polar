import { createStore } from 'easy-peasy';
import { createMockRootModel, injections, lightningServiceMock } from 'utils/tests';
import { CloseTapChannelArgs, closeTapChannelDefinition } from './closeTapChannel';

jest.mock('electron-log');

describe('closeTapChannel Tool', () => {
  const rootModel = createMockRootModel();

  // initialize store for type inference
  let store = createStore(rootModel, { injections });

  beforeEach(() => {
    // reset the store before each test run
    store = createStore(rootModel, { injections });
  });

  describe('closeTapChannelDefinition', () => {
    it('should have correct name', () => {
      expect(closeTapChannelDefinition.name).toBe('close_tap_channel');
    });

    it('should have a description', () => {
      expect(closeTapChannelDefinition.description).toBeTruthy();
      expect(closeTapChannelDefinition.description).toContain(
        'Close a Taproot Asset-enabled',
      );
      expect(closeTapChannelDefinition.description).toContain(
        'Lightning Network channel',
      );
      expect(closeTapChannelDefinition.description).toContain('litd nodes only');
    });

    it('should have input schema with required fields', () => {
      expect(closeTapChannelDefinition.inputSchema.type).toBe('object');
      expect(closeTapChannelDefinition.inputSchema.properties).toHaveProperty(
        'networkId',
      );
      expect(closeTapChannelDefinition.inputSchema.properties).toHaveProperty('nodeName');
      expect(closeTapChannelDefinition.inputSchema.properties).toHaveProperty(
        'channelPoint',
      );
      expect(closeTapChannelDefinition.inputSchema.required).toEqual([
        'networkId',
        'nodeName',
        'channelPoint',
      ]);
    });
  });

  describe('closeTapChannelTool', () => {
    const args: CloseTapChannelArgs = {
      networkId: 1,
      nodeName: 'alice-litd',
      channelPoint: 'abc123def:0',
    };

    beforeEach(() => {
      jest.clearAllMocks();
      lightningServiceMock.closeChannel.mockResolvedValue(undefined);
    });

    it('should close a Tap channel successfully', async () => {
      // Create a network with 1 litd node
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
      const nodeName = network.nodes.lightning[0].name;
      const channelPoint = 'test-channel-point:0';

      const result = await store.getActions().mcp.closeTapChannel({
        networkId: network.id,
        nodeName,
        channelPoint,
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain('Closed Tap channel');
      expect(result.message).toContain(channelPoint);
      expect(result.message).toContain(nodeName);
      expect(result.networkId).toBe(network.id);
      expect(result.nodeName).toBe(nodeName);
      expect(result.channelPoint).toBe(channelPoint);
    });

    it('should throw an error for invalid network ID', async () => {
      await expect(
        store.getActions().mcp.closeTapChannel({
          ...args,
          networkId: 999,
        }),
      ).rejects.toThrow("Network with the id '999' was not found.");
    });

    it('should throw an error for missing network ID', async () => {
      await expect(
        store.getActions().mcp.closeTapChannel({
          ...args,
          networkId: undefined as any,
        }),
      ).rejects.toThrow('Network ID is required');
    });

    it('should throw an error for missing node name', async () => {
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
        store.getActions().mcp.closeTapChannel({
          ...args,
          networkId: network.id,
          nodeName: '',
        }),
      ).rejects.toThrow('Node name is required');
    });

    it('should throw an error for missing channel point', async () => {
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
        store.getActions().mcp.closeTapChannel({
          ...args,
          networkId: network.id,
          channelPoint: '',
        }),
      ).rejects.toThrow('Channel point is required');
    });

    it('should throw an error for node not found', async () => {
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
        store.getActions().mcp.closeTapChannel({
          ...args,
          networkId: network.id,
          nodeName: 'non-existent-node',
        }),
      ).rejects.toThrow('Lightning node "non-existent-node" not found in network');
    });

    it('should call lightning.closeChannel with correct parameters', async () => {
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
      const nodeName = network.nodes.lightning[0].name;
      const channelPoint = 'test-channel-point:0';

      await store.getActions().mcp.closeTapChannel({
        networkId: network.id,
        nodeName,
        channelPoint,
      });

      expect(lightningServiceMock.closeChannel).toHaveBeenCalledWith(
        network.nodes.lightning[0],
        channelPoint,
      );
    });
  });
});
