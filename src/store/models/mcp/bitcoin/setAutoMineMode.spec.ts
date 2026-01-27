import { createStore } from 'easy-peasy';
import { AutoMineMode } from 'types';
import { createMockRootModel, injections } from 'utils/tests';

describe('MCP model > setAutoMineMode', () => {
  const rootModel = createMockRootModel();

  // initialize store for type inference
  let store = createStore(rootModel, { injections });

  beforeEach(() => {
    // reset the store before each test run
    store = createStore(rootModel, { injections });
    jest.clearAllMocks();
  });

  it('should set auto-mine mode to Off successfully', async () => {
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
    const result = await store.getActions().mcp.setAutoMineMode({
      networkId: network.id,
      mode: AutoMineMode.AutoOff,
    });

    expect(result.success).toBe(true);
    expect(result.message).toContain('Off');
    expect(result.message).toContain('test-network');
    expect(result.networkId).toBe(network.id);
    expect(result.mode).toBe(AutoMineMode.AutoOff);
  });

  it('should set auto-mine mode to Every 30 seconds successfully', async () => {
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
    const result = await store.getActions().mcp.setAutoMineMode({
      networkId: network.id,
      mode: AutoMineMode.Auto30s,
    });

    expect(result.success).toBe(true);
    expect(result.message).toContain('Every 30 seconds');
    expect(result.mode).toBe(AutoMineMode.Auto30s);
  });

  it('should set auto-mine mode to Every 1 minute successfully', async () => {
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
    const result = await store.getActions().mcp.setAutoMineMode({
      networkId: network.id,
      mode: AutoMineMode.Auto1m,
    });

    expect(result.success).toBe(true);
    expect(result.message).toContain('Every 1 minute');
    expect(result.mode).toBe(AutoMineMode.Auto1m);
  });

  it('should set auto-mine mode to Every 5 minutes successfully', async () => {
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
    const result = await store.getActions().mcp.setAutoMineMode({
      networkId: network.id,
      mode: AutoMineMode.Auto5m,
    });

    expect(result.success).toBe(true);
    expect(result.message).toContain('Every 5 minutes');
    expect(result.mode).toBe(AutoMineMode.Auto5m);
  });

  it('should set auto-mine mode to Every 10 minutes successfully', async () => {
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
    const result = await store.getActions().mcp.setAutoMineMode({
      networkId: network.id,
      mode: AutoMineMode.Auto10m,
    });

    expect(result.success).toBe(true);
    expect(result.message).toContain('Every 10 minutes');
    expect(result.mode).toBe(AutoMineMode.Auto10m);
  });

  it('should throw error when networkId is missing', async () => {
    await expect(
      store.getActions().mcp.setAutoMineMode({ mode: AutoMineMode.AutoOff } as any),
    ).rejects.toThrow('Network ID is required');
  });

  it('should throw error when mode is missing', async () => {
    await expect(
      store.getActions().mcp.setAutoMineMode({ networkId: 1 } as any),
    ).rejects.toThrow('Mode is required');
  });

  it('should throw error when mode is invalid', async () => {
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
      store.getActions().mcp.setAutoMineMode({
        networkId: network.id,
        mode: 999 as AutoMineMode, // Invalid mode
      }),
    ).rejects.toThrow('Invalid mode: 999');
  });

  it('should throw error when network does not exist', async () => {
    await expect(
      store.getActions().mcp.setAutoMineMode({
        networkId: 9999,
        mode: AutoMineMode.AutoOff,
      }),
    ).rejects.toThrow("Network with the id '9999' was not found");
  });
});
