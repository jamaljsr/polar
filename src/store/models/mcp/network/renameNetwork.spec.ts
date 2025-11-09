import { createStore } from 'easy-peasy';
import { createMockRootModel, injections } from 'utils/tests';

describe('MCP model > renameNetwork', () => {
  const rootModel = createMockRootModel();

  // initialize store for type inference
  let store = createStore(rootModel, { injections });

  beforeEach(() => {
    // reset the store before each test run
    store = createStore(rootModel, { injections });
    jest.clearAllMocks();
  });

  it('should rename a network successfully', async () => {
    // Create a network first
    await store.getActions().network.addNetwork({
      name: 'old-name',
      description: 'Old Description',
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
    expect(network.name).toBe('old-name');
    expect(network.description).toBe('Old Description');

    const result = await store.getActions().mcp.renameNetwork({
      networkId: network.id,
      name: 'new-name',
      description: 'New Description',
    });

    expect(result.success).toBe(true);
    expect(result.message).toContain('new-name');
    expect(result.message).toContain('successfully');
    expect(result.network.name).toBe('new-name');
    expect(result.network.description).toBe('New Description');

    // Verify network was updated in store
    const updatedNetwork = store.getState().network.networks[0];
    expect(updatedNetwork.name).toBe('new-name');
    expect(updatedNetwork.description).toBe('New Description');
  });

  it('should rename network without changing description when description is not provided', async () => {
    // Create a network first
    await store.getActions().network.addNetwork({
      name: 'test-network',
      description: 'Original Description',
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

    const result = await store.getActions().mcp.renameNetwork({
      networkId: network.id,
      name: 'renamed-network',
    });

    expect(result.success).toBe(true);
    expect(result.network.name).toBe('renamed-network');
    expect(result.network.description).toBe('Original Description');
  });

  it('should update only description when name remains the same', async () => {
    // Create a network first
    await store.getActions().network.addNetwork({
      name: 'test-network',
      description: 'Original Description',
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

    const result = await store.getActions().mcp.renameNetwork({
      networkId: network.id,
      name: 'test-network',
      description: 'Updated Description',
    });

    expect(result.success).toBe(true);
    expect(result.network.name).toBe('test-network');
    expect(result.network.description).toBe('Updated Description');
  });

  it('should throw error when networkId is missing', async () => {
    await expect(
      store.getActions().mcp.renameNetwork({
        networkId: null as any,
        name: 'new-name',
      }),
    ).rejects.toThrow('Network ID is required');
  });

  it('should throw error when networkId is undefined', async () => {
    await expect(
      store.getActions().mcp.renameNetwork({
        networkId: undefined as any,
        name: 'new-name',
      }),
    ).rejects.toThrow('Network ID is required');
  });

  it('should throw error when name is missing', async () => {
    // Create a network first
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
      store.getActions().mcp.renameNetwork({
        networkId: network.id,
        name: '',
      }),
    ).rejects.toThrow('Network name is required');
  });

  it('should throw error when name is not provided', async () => {
    // Create a network first
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
      store.getActions().mcp.renameNetwork({
        networkId: network.id,
        name: null as any,
      }),
    ).rejects.toThrow('Network name is required');
  });

  it('should throw error when network does not exist', async () => {
    await expect(
      store.getActions().mcp.renameNetwork({
        networkId: 9999,
        name: 'new-name',
      }),
    ).rejects.toThrow("Network with the id '9999' was not found");
  });

  it('should preserve other network properties when renaming', async () => {
    // Create a network first
    await store.getActions().network.addNetwork({
      name: 'test-network',
      description: 'Test',
      lndNodes: 2,
      clightningNodes: 1,
      eclairNodes: 0,
      bitcoindNodes: 1,
      tapdNodes: 0,
      litdNodes: 0,
      customNodes: {},
      manualMineCount: 6,
    });

    const network = store.getState().network.networks[0];
    const originalNodeCount =
      network.nodes.lightning.length + network.nodes.bitcoin.length;

    const result = await store.getActions().mcp.renameNetwork({
      networkId: network.id,
      name: 'renamed-network',
      description: 'New desc',
    });

    expect(
      result.network.nodes.lightning.length + result.network.nodes.bitcoin.length,
    ).toBe(originalNodeCount);
  });

  it('should handle empty description correctly', async () => {
    // Create a network first
    await store.getActions().network.addNetwork({
      name: 'test-network',
      description: 'Old',
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

    const result = await store.getActions().mcp.renameNetwork({
      networkId: network.id,
      name: 'new-name',
      description: '',
    });

    expect(result.success).toBe(true);
    expect(result.network.name).toBe('new-name');
    expect(result.network.description).toBe('');
  });
});
