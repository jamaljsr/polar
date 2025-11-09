import { createStore } from 'easy-peasy';
import { createMockRootModel, injections } from 'utils/tests';

describe('MCP model > listNetworks', () => {
  const rootModel = createMockRootModel();

  // initialize store for type inference
  let store = createStore(rootModel, { injections });

  beforeEach(() => {
    // reset the store before each test run
    store = createStore(rootModel, { injections });
    jest.clearAllMocks();
  });

  it('should return an empty list when no networks exist', () => {
    const result = store.getActions().mcp.listNetworks();
    expect(result.networks).toEqual([]);
  });

  it('should return all networks from the store', async () => {
    // Add some networks to the store
    await store.getActions().network.addNetwork({
      name: 'test-network-1',
      description: 'Test Network 1',
      lndNodes: 2,
      clightningNodes: 0,
      eclairNodes: 0,
      bitcoindNodes: 1,
      tapdNodes: 0,
      litdNodes: 0,
      customNodes: {},
      manualMineCount: 6,
    });

    await store.getActions().network.addNetwork({
      name: 'test-network-2',
      description: 'Test Network 2',
      lndNodes: 1,
      clightningNodes: 1,
      eclairNodes: 0,
      bitcoindNodes: 1,
      tapdNodes: 0,
      litdNodes: 0,
      customNodes: {},
      manualMineCount: 6,
    });

    const result = store.getActions().mcp.listNetworks();
    expect(result.networks).toHaveLength(2);
    expect(result.networks[0].name).toBe('test-network-1');
    expect(result.networks[1].name).toBe('test-network-2');
  });
});
