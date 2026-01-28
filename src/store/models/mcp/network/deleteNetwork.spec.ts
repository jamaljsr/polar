import { createStore } from 'easy-peasy';
import { createMockRootModel, injections } from 'utils/tests';

describe('MCP model > deleteNetwork', () => {
  const rootModel = createMockRootModel();

  // initialize store for type inference
  let store = createStore(rootModel, { injections });

  beforeEach(() => {
    // reset the store before each test run
    store = createStore(rootModel, { injections });
    jest.clearAllMocks();
  });

  it('should delete a network successfully', async () => {
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

    expect(store.getState().network.networks).toHaveLength(1);

    const network = store.getState().network.networks[0];
    const result = await store.getActions().mcp.deleteNetwork({ networkId: network.id });

    expect(result.success).toBe(true);
    expect(result.message).toContain('test-network');
    expect(result.message).toContain('deleted successfully');
    expect(result.network.id).toBe(network.id);

    // Verify network was removed from store
    expect(store.getState().network.networks).toHaveLength(0);
  });

  it('should throw error when networkId is missing', async () => {
    await expect(store.getActions().mcp.deleteNetwork({} as any)).rejects.toThrow(
      'Network ID is required',
    );
  });

  it('should throw error when network does not exist', async () => {
    await expect(
      store.getActions().mcp.deleteNetwork({ networkId: 9999 }),
    ).rejects.toThrow("Network with the id '9999' was not found");
  });
});
