import { createStore } from 'easy-peasy';
import { createMockRootModel, injections, lightningServiceMock } from 'utils/tests';

describe('MCP model > openChannel', () => {
  const rootModel = createMockRootModel();

  // initialize store for type inference
  let store = createStore(rootModel, { injections });

  beforeEach(() => {
    // reset the store before each test run
    store = createStore(rootModel, { injections });
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
    lightningServiceMock.getNewAddress.mockResolvedValue({ address: 'bcrt1qtest123' });
    lightningServiceMock.openChannel.mockResolvedValue({ txid: 'abc123', index: 0 });
  });

  it('should open a channel successfully', async () => {
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
    const fromNode = network.nodes.lightning[0].name;
    const toNode = network.nodes.lightning[1].name;

    const result = await store.getActions().mcp.openChannel({
      networkId: network.id,
      fromNode,
      toNode,
      sats: 100000,
    });

    expect(result.success).toBe(true);
    expect(result.message).toContain('Opened channel');
    expect(result.message).toContain(fromNode);
    expect(result.message).toContain(toNode);
    expect(result.message).toContain('100000 sats');
    expect(result.networkId).toBe(network.id);
    expect(result.fromNode).toBe(fromNode);
    expect(result.toNode).toBe(toNode);
    expect(result.capacity).toBe(100000);
    expect(result.channelPoint).toBeDefined();
    expect(result.channelPoint).toContain(':');
  });

  it('should open a private channel when isPrivate is true', async () => {
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
    const fromNode = network.nodes.lightning[0].name;
    const toNode = network.nodes.lightning[1].name;

    const result = await store.getActions().mcp.openChannel({
      networkId: network.id,
      fromNode,
      toNode,
      sats: 50000,
      isPrivate: true,
    });

    expect(result.success).toBe(true);
    expect(result.capacity).toBe(50000);
    expect(result.channelPoint).toBeDefined();
    expect(result.channelPoint).toContain(':');
  });

  it('should open a channel with autoFund enabled', async () => {
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
    const fromNode = network.nodes.lightning[0].name;
    const toNode = network.nodes.lightning[1].name;

    const result = await store.getActions().mcp.openChannel({
      networkId: network.id,
      fromNode,
      toNode,
      sats: 75000,
      autoFund: true,
    });

    expect(result.success).toBe(true);
    expect(result.capacity).toBe(75000);
    expect(result.channelPoint).toBeDefined();
    expect(result.channelPoint).toContain(':');
  });

  it('should throw error when networkId is missing', async () => {
    await expect(
      store.getActions().mcp.openChannel({
        fromNode: 'alice',
        toNode: 'bob',
        sats: 100000,
      } as any),
    ).rejects.toThrow('Network ID is required');
  });

  it('should throw error when fromNode is missing', async () => {
    await expect(
      store.getActions().mcp.openChannel({
        networkId: 1,
        toNode: 'bob',
        sats: 100000,
      } as any),
    ).rejects.toThrow('From node name is required');
  });

  it('should throw error when toNode is missing', async () => {
    await expect(
      store.getActions().mcp.openChannel({
        networkId: 1,
        fromNode: 'alice',
        sats: 100000,
      } as any),
    ).rejects.toThrow('To node name is required');
  });

  it('should throw error when sats is missing', async () => {
    await expect(
      store.getActions().mcp.openChannel({
        networkId: 1,
        fromNode: 'alice',
        toNode: 'bob',
      } as any),
    ).rejects.toThrow('Channel capacity in sats must be greater than 0');
  });

  it('should throw error when sats is zero', async () => {
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
      store.getActions().mcp.openChannel({
        networkId: network.id,
        fromNode: 'alice',
        toNode: 'bob',
        sats: 0,
      }),
    ).rejects.toThrow('Channel capacity in sats must be greater than 0');
  });

  it('should throw error when sats is negative', async () => {
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
      store.getActions().mcp.openChannel({
        networkId: network.id,
        fromNode: 'alice',
        toNode: 'bob',
        sats: -5000,
      }),
    ).rejects.toThrow('Channel capacity in sats must be greater than 0');
  });

  it('should throw error when network does not exist', async () => {
    await expect(
      store.getActions().mcp.openChannel({
        networkId: 9999,
        fromNode: 'alice',
        toNode: 'bob',
        sats: 100000,
      }),
    ).rejects.toThrow("Network with the id '9999' was not found");
  });

  it('should throw error when fromNode does not exist', async () => {
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
      store.getActions().mcp.openChannel({
        networkId: network.id,
        fromNode: 'nonexistent-node',
        toNode: network.nodes.lightning[0].name,
        sats: 100000,
      }),
    ).rejects.toThrow('Lightning node "nonexistent-node" not found in network');
  });

  it('should throw error when toNode does not exist', async () => {
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
      store.getActions().mcp.openChannel({
        networkId: network.id,
        fromNode: network.nodes.lightning[0].name,
        toNode: 'nonexistent-node',
        sats: 100000,
      }),
    ).rejects.toThrow('Lightning node "nonexistent-node" not found in network');
  });

  it('should throw error when fromNode and toNode are the same', async () => {
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

    await expect(
      store.getActions().mcp.openChannel({
        networkId: network.id,
        fromNode: nodeName,
        toNode: nodeName,
        sats: 100000,
      }),
    ).rejects.toThrow('Cannot open channel between the same node');
  });
});
