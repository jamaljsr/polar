import { createStore } from 'easy-peasy';
import { LightningNodeBalances } from 'lib/lightning/types';
import { createMockRootModel, injections, lightningServiceMock } from 'utils/tests';

describe('MCP model > getWalletBalance', () => {
  const rootModel = createMockRootModel();

  // initialize store for type inference
  let store = createStore(rootModel, { injections });

  const mockBalance: LightningNodeBalances = {
    total: '5000000',
    confirmed: '4500000',
    unconfirmed: '500000',
  };

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
    lightningServiceMock.getBalances.mockResolvedValue(mockBalance);
  });

  it('should get balance successfully', async () => {
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

    const result = await store.getActions().mcp.getWalletBalance({
      networkId: network.id,
      nodeName,
    });

    expect(result.success).toBe(true);
    expect(result.message).toContain('Retrieved balance');
    expect(result.message).toContain(nodeName);
    expect(result.message).toContain('5000000 sats total');
    expect(result.networkId).toBe(network.id);
    expect(result.nodeName).toBe(nodeName);
    expect(result.balance.total).toBe('5000000');
    expect(result.balance.confirmed).toBe('4500000');
    expect(result.balance.unconfirmed).toBe('500000');
  });

  it('should handle zero balance', async () => {
    lightningServiceMock.getBalances.mockResolvedValue({
      total: '0',
      confirmed: '0',
      unconfirmed: '0',
    });

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

    const result = await store.getActions().mcp.getWalletBalance({
      networkId: network.id,
      nodeName,
    });

    expect(result.success).toBe(true);
    expect(result.message).toContain('0 sats total');
    expect(result.balance.total).toBe('0');
    expect(result.balance.confirmed).toBe('0');
    expect(result.balance.unconfirmed).toBe('0');
  });

  it('should handle only confirmed balance', async () => {
    lightningServiceMock.getBalances.mockResolvedValue({
      total: '1000000',
      confirmed: '1000000',
      unconfirmed: '0',
    });

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

    const result = await store.getActions().mcp.getWalletBalance({
      networkId: network.id,
      nodeName,
    });

    expect(result.success).toBe(true);
    expect(result.balance.total).toBe('1000000');
    expect(result.balance.confirmed).toBe('1000000');
    expect(result.balance.unconfirmed).toBe('0');
  });

  it('should throw error when networkId is missing', async () => {
    await expect(
      store.getActions().mcp.getWalletBalance({
        nodeName: 'alice',
      } as any),
    ).rejects.toThrow('Network ID is required');
  });

  it('should throw error when nodeName is missing', async () => {
    await expect(
      store.getActions().mcp.getWalletBalance({
        networkId: 1,
      } as any),
    ).rejects.toThrow('Node name is required');
  });

  it('should throw error when network does not exist', async () => {
    await expect(
      store.getActions().mcp.getWalletBalance({
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
      store.getActions().mcp.getWalletBalance({
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

    const result = await store.getActions().mcp.getWalletBalance({
      networkId: network.id,
      nodeName,
    });

    expect(result.success).toBe(true);
    expect(result.balance.total).toBe('5000000');
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

    const result = await store.getActions().mcp.getWalletBalance({
      networkId: network.id,
      nodeName,
    });

    expect(result.success).toBe(true);
    expect(result.balance.total).toBe('5000000');
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

    const result = await store.getActions().mcp.getWalletBalance({
      networkId: network.id,
      nodeName,
    });

    expect(result.success).toBe(true);
    expect(result.balance.total).toBe('5000000');
  });

  it('should return zero balance when no model state is found', async () => {
    lightningServiceMock.getBalances.mockResolvedValue(undefined as any);

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

    const result = await store.getActions().mcp.getWalletBalance({
      networkId: network.id,
      nodeName,
    });

    expect(result.success).toBe(true);
    expect(result.balance.total).toBe('0');
  });
});
