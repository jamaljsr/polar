import { createStore } from 'easy-peasy';
import { createMockRootModel, injections } from 'utils/tests';

describe('MCP model > mineBlocks', () => {
  const rootModel = createMockRootModel();

  // initialize store for type inference
  let store = createStore(rootModel, { injections });

  beforeEach(() => {
    // reset the store before each test run
    store = createStore(rootModel, { injections });
    jest.clearAllMocks();
  });

  it('should mine blocks successfully with default node', async () => {
    // Create a network first
    await store.getActions().network.addNetwork({
      name: 'test-network',
      description: 'Test',
      lndNodes: 1,
      clightningNodes: 0,
      eclairNodes: 0,
      bitcoindNodes: 1,
      btcdNodes: 0,
      tapdNodes: 0,
      litdNodes: 0,
      customNodes: {},
      manualMineCount: 6,
    });

    const network = store.getState().network.networks[0];
    const result = await store.getActions().mcp.mineBlocks({
      networkId: network.id,
      blocks: 10,
    });

    expect(result.success).toBe(true);
    expect(result.message).toContain('10 blocks');
    expect(result.networkId).toBe(network.id);
    expect(result.nodeName).toBe('backend1');
    expect(result.blocksMined).toBe(10);
  });

  it('should mine blocks with specified node name', async () => {
    // Create a network with multiple bitcoin nodes
    await store.getActions().network.addNetwork({
      name: 'test-network',
      description: 'Test',
      lndNodes: 1,
      clightningNodes: 0,
      eclairNodes: 0,
      bitcoindNodes: 2,
      btcdNodes: 0,
      tapdNodes: 0,
      litdNodes: 0,
      customNodes: {},
      manualMineCount: 6,
    });

    const network = store.getState().network.networks[0];
    const result = await store.getActions().mcp.mineBlocks({
      networkId: network.id,
      blocks: 5,
      nodeName: 'backend2',
    });

    expect(result.success).toBe(true);
    expect(result.message).toContain('5 blocks');
    expect(result.nodeName).toBe('backend2');
    expect(result.blocksMined).toBe(5);
  });

  it('should mine 1 block with singular message', async () => {
    await store.getActions().network.addNetwork({
      name: 'test-network',
      description: 'Test',
      lndNodes: 1,
      clightningNodes: 0,
      eclairNodes: 0,
      bitcoindNodes: 1,
      btcdNodes: 0,
      tapdNodes: 0,
      litdNodes: 0,
      customNodes: {},
      manualMineCount: 6,
    });

    const network = store.getState().network.networks[0];
    const result = await store.getActions().mcp.mineBlocks({
      networkId: network.id,
      blocks: 1,
    });

    expect(result.success).toBe(true);
    expect(result.message).toContain('1 block');
    expect(result.message).not.toContain('blocks'); // Should be singular
    expect(result.blocksMined).toBe(1);
  });

  it('should mine 6 blocks by default when blocks parameter is not specified', async () => {
    await store.getActions().network.addNetwork({
      name: 'test-network',
      description: 'Test',
      lndNodes: 1,
      clightningNodes: 0,
      eclairNodes: 0,
      bitcoindNodes: 1,
      btcdNodes: 0,
      tapdNodes: 0,
      litdNodes: 0,
      customNodes: {},
      manualMineCount: 6,
    });

    const network = store.getState().network.networks[0];
    const result = await store.getActions().mcp.mineBlocks({
      networkId: network.id,
    });

    expect(result.success).toBe(true);
    expect(result.message).toContain('6 blocks');
    expect(result.blocksMined).toBe(6);
  });

  it('should throw error when networkId is missing', async () => {
    await expect(
      store.getActions().mcp.mineBlocks({ blocks: 10 } as any),
    ).rejects.toThrow('Network ID is required');
  });

  it('should throw error when blocks is zero', async () => {
    await store.getActions().network.addNetwork({
      name: 'test-network',
      description: 'Test',
      lndNodes: 1,
      clightningNodes: 0,
      eclairNodes: 0,
      bitcoindNodes: 1,
      btcdNodes: 0,
      tapdNodes: 0,
      litdNodes: 0,
      customNodes: {},
      manualMineCount: 6,
    });

    const network = store.getState().network.networks[0];
    await expect(
      store.getActions().mcp.mineBlocks({ networkId: network.id, blocks: 0 }),
    ).rejects.toThrow('Number of blocks must be greater than 0');
  });

  it('should throw error when blocks is negative', async () => {
    await store.getActions().network.addNetwork({
      name: 'test-network',
      description: 'Test',
      lndNodes: 1,
      clightningNodes: 0,
      eclairNodes: 0,
      bitcoindNodes: 1,
      btcdNodes: 0,
      tapdNodes: 0,
      litdNodes: 0,
      customNodes: {},
      manualMineCount: 6,
    });

    const network = store.getState().network.networks[0];
    await expect(
      store.getActions().mcp.mineBlocks({ networkId: network.id, blocks: -5 }),
    ).rejects.toThrow('Number of blocks must be greater than 0');
  });

  it('should throw error when network does not exist', async () => {
    await expect(
      store.getActions().mcp.mineBlocks({ networkId: 9999, blocks: 10 }),
    ).rejects.toThrow("Network with the id '9999' was not found");
  });

  it('should throw error when network has no bitcoin nodes', async () => {
    await store.getActions().network.addNetwork({
      name: 'test-network',
      description: 'Test',
      lndNodes: 0,
      clightningNodes: 0,
      eclairNodes: 0,
      bitcoindNodes: 0, // No bitcoin nodes
      btcdNodes: 0,
      tapdNodes: 0,
      litdNodes: 0,
      customNodes: {},
      manualMineCount: 6,
    });

    const network = store.getState().network.networks[0];
    await expect(
      store.getActions().mcp.mineBlocks({ networkId: network.id, blocks: 10 }),
    ).rejects.toThrow('Network has no Bitcoin nodes');
  });

  it('should throw error when specified node does not exist', async () => {
    await store.getActions().network.addNetwork({
      name: 'test-network',
      description: 'Test',
      lndNodes: 1,
      clightningNodes: 0,
      eclairNodes: 0,
      bitcoindNodes: 1,
      btcdNodes: 0,
      tapdNodes: 0,
      litdNodes: 0,
      customNodes: {},
      manualMineCount: 6,
    });

    const network = store.getState().network.networks[0];
    await expect(
      store.getActions().mcp.mineBlocks({
        networkId: network.id,
        blocks: 10,
        nodeName: 'nonexistent-node',
      }),
    ).rejects.toThrow('Bitcoin node "nonexistent-node" not found in network');
  });
});
