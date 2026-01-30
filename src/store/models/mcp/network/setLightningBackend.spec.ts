import { createStore } from 'easy-peasy';
import { createMockRootModel, injections } from 'utils/tests';

describe('MCP model > setLightningBackend', () => {
  const rootModel = createMockRootModel();

  // initialize store for type inference
  let store = createStore(rootModel, { injections });

  beforeEach(() => {
    // reset the store before each test run
    store = createStore(rootModel, { injections });
    jest.clearAllMocks();
  });

  it('should set Lightning backend successfully', async () => {
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
    const result = await store.getActions().mcp.setLightningBackend({
      networkId: network.id,
      lightningNodeName: 'alice',
      bitcoinNodeName: 'backend2',
    });

    expect(result.success).toBe(true);
    expect(result.message).toContain('Successfully changed backend');
    expect(result.message).toContain('alice');
    expect(result.message).toContain('backend2');
    expect(result.message).toContain('test-network');
    expect(result.networkId).toBe(network.id);
    expect(result.lightningNodeName).toBe('alice');
    expect(result.bitcoinNodeName).toBe('backend2');

    // Verify the backend was actually changed
    const updatedNetwork = store.getState().network.networks[0];
    expect(updatedNetwork.nodes.lightning[0].backendName).toBe('backend2');
  });

  it('should throw error when networkId is missing', async () => {
    await expect(
      store.getActions().mcp.setLightningBackend({
        lightningNodeName: 'alice',
        bitcoinNodeName: 'backend2',
      } as any),
    ).rejects.toThrow('Network ID is required');
  });

  it('should throw error when lightningNodeName is missing', async () => {
    await expect(
      store.getActions().mcp.setLightningBackend({
        networkId: 1,
        bitcoinNodeName: 'backend2',
      } as any),
    ).rejects.toThrow('Lightning node name is required');
  });

  it('should throw error when bitcoinNodeName is missing', async () => {
    await expect(
      store.getActions().mcp.setLightningBackend({
        networkId: 1,
        lightningNodeName: 'alice',
      } as any),
    ).rejects.toThrow('Bitcoin node name is required');
  });

  it('should throw error when network does not exist', async () => {
    await expect(
      store.getActions().mcp.setLightningBackend({
        networkId: 9999,
        lightningNodeName: 'alice',
        bitcoinNodeName: 'backend2',
      }),
    ).rejects.toThrow("Network with the id '9999' was not found");
  });

  it('should throw error when Lightning node does not exist', async () => {
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
    await expect(
      store.getActions().mcp.setLightningBackend({
        networkId: network.id,
        lightningNodeName: 'nonexistent',
        bitcoinNodeName: 'backend2',
      }),
    ).rejects.toThrow("The node 'nonexistent' was not found");
  });

  it('should throw error when Bitcoin node does not exist', async () => {
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
    await expect(
      store.getActions().mcp.setLightningBackend({
        networkId: network.id,
        lightningNodeName: 'alice',
        bitcoinNodeName: 'nonexistent',
      }),
    ).rejects.toThrow("The node 'nonexistent' was not found");
  });

  it('should throw error when trying to set the same backend', async () => {
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
    await expect(
      store.getActions().mcp.setLightningBackend({
        networkId: network.id,
        lightningNodeName: 'alice',
        bitcoinNodeName: 'backend1', // alice is already connected to backend1
      }),
    ).rejects.toThrow("The node 'alice' is already connected to 'backend1'");
  });
});
