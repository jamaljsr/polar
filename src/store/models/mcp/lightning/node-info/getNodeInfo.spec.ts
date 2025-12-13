import { createStore } from 'easy-peasy';
import { LightningNodeInfo } from 'lib/lightning/types';
import { createMockRootModel, injections, lightningServiceMock } from 'utils/tests';

describe('MCP model > getNodeInfo', () => {
  const rootModel = createMockRootModel();

  // initialize store for type inference
  let store = createStore(rootModel, { injections });

  const mockNodeInfo: LightningNodeInfo = {
    pubkey: '02abcd1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab',
    alias: 'test-node-alias',
    syncedToChain: true,
    blockHeight: 850000,
    numPendingChannels: 1,
    numActiveChannels: 3,
    numInactiveChannels: 0,
    rpcUrl: 'test-node@localhost:9735',
  };

  beforeEach(() => {
    // reset the store before each test run
    store = createStore(rootModel, { injections });
    jest.clearAllMocks();
    lightningServiceMock.getInfo.mockResolvedValue(mockNodeInfo);
    lightningServiceMock.getBalances.mockResolvedValue({
      total: '5000000',
      confirmed: '4500000',
      unconfirmed: '500000',
    });
  });

  it('should get node info successfully', async () => {
    // Create a network with 1 LND node
    await store.getActions().network.addNetwork({
      name: 'test-network',
      description: 'Test',
      lndNodes: 1,
      clightningNodes: 0,
      eclairNodes: 0,
      bitcoindNodes: 1,
      tapdNodes: 0,
      litdNodes: 0,
      customNodes: {},
      manualMineCount: 6,
    });

    const network = store.getState().network.networks[0];
    const nodeName = network.nodes.lightning[0].name;

    const result = await store.getActions().mcp.getNodeInfo({
      networkId: network.id,
      nodeName,
    });

    expect(result.success).toBe(true);
    expect(result.message).toContain('Retrieved info for node');
    expect(result.message).toContain(nodeName);
    expect(result.message).toContain('test-node-alias');
    expect(result.message).toContain('02abcd123456...');
    expect(result.networkId).toBe(network.id);
    expect(result.nodeName).toBe(nodeName);
    expect(result.info.pubkey).toBe(mockNodeInfo.pubkey);
    expect(result.info.alias).toBe(mockNodeInfo.alias);
    expect(result.info.syncedToChain).toBe(true);
    expect(result.info.blockHeight).toBe(850000);
    expect(result.info.numPendingChannels).toBe(1);
    expect(result.info.numActiveChannels).toBe(3);
    expect(result.info.numInactiveChannels).toBe(0);
  });

  it('should handle node not synced to chain', async () => {
    const unsyncedInfo: LightningNodeInfo = {
      ...mockNodeInfo,
      syncedToChain: false,
      blockHeight: 800000,
    };
    lightningServiceMock.getInfo.mockResolvedValue(unsyncedInfo);

    await store.getActions().network.addNetwork({
      name: 'test-network',
      description: 'Test',
      lndNodes: 1,
      clightningNodes: 0,
      eclairNodes: 0,
      bitcoindNodes: 1,
      tapdNodes: 0,
      litdNodes: 0,
      customNodes: {},
      manualMineCount: 6,
    });

    const network = store.getState().network.networks[0];
    const nodeName = network.nodes.lightning[0].name;

    const result = await store.getActions().mcp.getNodeInfo({
      networkId: network.id,
      nodeName,
    });

    expect(result.success).toBe(true);
    expect(result.info.syncedToChain).toBe(false);
    expect(result.info.blockHeight).toBe(800000);
  });

  it('should handle node with no channels', async () => {
    const noChannelsInfo: LightningNodeInfo = {
      ...mockNodeInfo,
      numPendingChannels: 0,
      numActiveChannels: 0,
      numInactiveChannels: 0,
    };
    lightningServiceMock.getInfo.mockResolvedValue(noChannelsInfo);

    await store.getActions().network.addNetwork({
      name: 'test-network',
      description: 'Test',
      lndNodes: 1,
      clightningNodes: 0,
      eclairNodes: 0,
      bitcoindNodes: 1,
      tapdNodes: 0,
      litdNodes: 0,
      customNodes: {},
      manualMineCount: 6,
    });

    const network = store.getState().network.networks[0];
    const nodeName = network.nodes.lightning[0].name;

    const result = await store.getActions().mcp.getNodeInfo({
      networkId: network.id,
      nodeName,
    });

    expect(result.success).toBe(true);
    expect(result.info.numPendingChannels).toBe(0);
    expect(result.info.numActiveChannels).toBe(0);
    expect(result.info.numInactiveChannels).toBe(0);
  });

  it('should throw error when networkId is missing', async () => {
    await expect(
      store.getActions().mcp.getNodeInfo({
        nodeName: 'alice',
      } as any),
    ).rejects.toThrow('Network ID is required');
  });

  it('should throw error when nodeName is missing', async () => {
    await expect(
      store.getActions().mcp.getNodeInfo({
        networkId: 1,
      } as any),
    ).rejects.toThrow('Node name is required');
  });

  it('should throw error when network does not exist', async () => {
    await expect(
      store.getActions().mcp.getNodeInfo({
        networkId: 9999,
        nodeName: 'alice',
      }),
    ).rejects.toThrow("Network with the id '9999' was not found");
  });

  it('should throw error when node does not exist', async () => {
    await store.getActions().network.addNetwork({
      name: 'test-network',
      description: 'Test',
      lndNodes: 1,
      clightningNodes: 0,
      eclairNodes: 0,
      bitcoindNodes: 1,
      tapdNodes: 0,
      litdNodes: 0,
      customNodes: {},
      manualMineCount: 6,
    });

    const network = store.getState().network.networks[0];

    await expect(
      store.getActions().mcp.getNodeInfo({
        networkId: network.id,
        nodeName: 'nonexistent-node',
      }),
    ).rejects.toThrow('Lightning node "nonexistent-node" not found in network');
  });

  it('should work with c-lightning nodes', async () => {
    await store.getActions().network.addNetwork({
      name: 'test-network',
      description: 'Test',
      lndNodes: 0,
      clightningNodes: 1,
      eclairNodes: 0,
      bitcoindNodes: 1,
      tapdNodes: 0,
      litdNodes: 0,
      customNodes: {},
      manualMineCount: 6,
    });

    const network = store.getState().network.networks[0];
    const nodeName = network.nodes.lightning[0].name;

    const result = await store.getActions().mcp.getNodeInfo({
      networkId: network.id,
      nodeName,
    });

    expect(result.success).toBe(true);
    expect(result.info.pubkey).toBe(mockNodeInfo.pubkey);
    expect(result.info.alias).toBe(mockNodeInfo.alias);
  });

  it('should work with eclair nodes', async () => {
    await store.getActions().network.addNetwork({
      name: 'test-network',
      description: 'Test',
      lndNodes: 0,
      clightningNodes: 0,
      eclairNodes: 1,
      bitcoindNodes: 1,
      tapdNodes: 0,
      litdNodes: 0,
      customNodes: {},
      manualMineCount: 6,
    });

    const network = store.getState().network.networks[0];
    const nodeName = network.nodes.lightning[0].name;

    const result = await store.getActions().mcp.getNodeInfo({
      networkId: network.id,
      nodeName,
    });

    expect(result.success).toBe(true);
    expect(result.info.pubkey).toBe(mockNodeInfo.pubkey);
    expect(result.info.alias).toBe(mockNodeInfo.alias);
  });

  it('should work with litd nodes', async () => {
    await store.getActions().network.addNetwork({
      name: 'test-network',
      description: 'Test',
      lndNodes: 0,
      clightningNodes: 0,
      eclairNodes: 0,
      bitcoindNodes: 1,
      tapdNodes: 0,
      litdNodes: 1,
      customNodes: {},
      manualMineCount: 6,
    });

    const network = store.getState().network.networks[0];
    const nodeName = network.nodes.lightning[0].name;

    const result = await store.getActions().mcp.getNodeInfo({
      networkId: network.id,
      nodeName,
    });

    expect(result.success).toBe(true);
    expect(result.info.pubkey).toBe(mockNodeInfo.pubkey);
    expect(result.info.alias).toBe(mockNodeInfo.alias);
  });

  it('should throw error when node info is not available', async () => {
    // Mock the getInfo to return undefined (no data available)
    lightningServiceMock.getInfo.mockResolvedValue(undefined as any);

    await store.getActions().network.addNetwork({
      name: 'test-network',
      description: 'Test',
      lndNodes: 1,
      clightningNodes: 0,
      eclairNodes: 0,
      bitcoindNodes: 1,
      tapdNodes: 0,
      litdNodes: 0,
      customNodes: {},
      manualMineCount: 6,
    });

    const network = store.getState().network.networks[0];
    const nodeName = network.nodes.lightning[0].name;

    await expect(
      store.getActions().mcp.getNodeInfo({
        networkId: network.id,
        nodeName,
      }),
    ).rejects.toThrow('Failed to retrieve node info');
  });
});
