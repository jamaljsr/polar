import { createStore } from 'easy-peasy';
import { createMockRootModel, injections, lightningServiceMock } from 'utils/tests';

describe('MCP model > closeChannel', () => {
  const rootModel = createMockRootModel();

  // initialize store for type inference
  let store = createStore(rootModel, { injections });

  beforeEach(() => {
    // reset the store before each test run
    store = createStore(rootModel, { injections });
    jest.clearAllMocks();
    lightningServiceMock.closeChannel.mockResolvedValue(true);
  });

  it('should close a channel successfully', async () => {
    // Create a network with 2 LND nodes
    await store.getActions().network.addNetwork({
      name: 'test-network',
      description: 'Test',
      lndNodes: 2,
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
    const channelPoint = 'abc123def456:0';

    const result = await store.getActions().mcp.closeChannel({
      networkId: network.id,
      nodeName,
      channelPoint,
    });

    expect(result.success).toBe(true);
    expect(result.message).toContain('Closed channel');
    expect(result.message).toContain(channelPoint);
    expect(result.message).toContain(nodeName);
    expect(result.networkId).toBe(network.id);
    expect(result.nodeName).toBe(nodeName);
    expect(result.channelPoint).toBe(channelPoint);
  });

  it('should throw error when networkId is missing', async () => {
    await expect(
      store.getActions().mcp.closeChannel({
        nodeName: 'alice',
        channelPoint: 'abc:0',
      } as any),
    ).rejects.toThrow('Network ID is required');
  });

  it('should throw error when nodeName is missing', async () => {
    await expect(
      store.getActions().mcp.closeChannel({
        networkId: 1,
        channelPoint: 'abc:0',
      } as any),
    ).rejects.toThrow('Node name is required');
  });

  it('should throw error when channelPoint is missing', async () => {
    await expect(
      store.getActions().mcp.closeChannel({
        networkId: 1,
        nodeName: 'alice',
      } as any),
    ).rejects.toThrow('Channel point is required');
  });

  it('should throw error when network does not exist', async () => {
    await expect(
      store.getActions().mcp.closeChannel({
        networkId: 9999,
        nodeName: 'alice',
        channelPoint: 'abc:0',
      }),
    ).rejects.toThrow("Network with the id '9999' was not found");
  });

  it('should throw error when node does not exist', async () => {
    await store.getActions().network.addNetwork({
      name: 'test-network',
      description: 'Test',
      lndNodes: 2,
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
      store.getActions().mcp.closeChannel({
        networkId: network.id,
        nodeName: 'nonexistent-node',
        channelPoint: 'abc:0',
      }),
    ).rejects.toThrow('Lightning node "nonexistent-node" not found in network');
  });
});
