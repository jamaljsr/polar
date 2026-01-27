import { createStore } from 'easy-peasy';
import { createMockRootModel, injections } from 'utils/tests';

describe('MCP model > updateNodeCommand', () => {
  const rootModel = createMockRootModel();

  // initialize store for type inference
  let store = createStore(rootModel, { injections });

  beforeEach(() => {
    // reset the store before each test run
    store = createStore(rootModel, { injections });
    jest.clearAllMocks();
  });

  it('should update node command successfully', async () => {
    // Create a network with a node
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
    const customCommand = 'lnd --custom-flag=value';

    const result = await store.getActions().mcp.updateNodeCommand({
      networkId: network.id,
      nodeName: 'alice',
      command: customCommand,
    });

    expect(result.success).toBe(true);
    expect(result.message).toContain('Successfully updated custom command');
    expect(result.message).toContain('alice');
    expect(result.message).toContain('test-network');
    expect(result.networkId).toBe(network.id);
    expect(result.nodeName).toBe('alice');
    expect(result.command).toBe(customCommand);
  });

  it('should reset node command to default when empty string provided', async () => {
    // Create a network with a node
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

    const result = await store.getActions().mcp.updateNodeCommand({
      networkId: network.id,
      nodeName: 'alice',
      command: '',
    });

    expect(result.success).toBe(true);
    expect(result.message).toContain('Successfully reset node');
    expect(result.message).toContain('to use default command');
    expect(result.message).toContain('alice');
    expect(result.message).toContain('test-network');
    expect(result.networkId).toBe(network.id);
    expect(result.nodeName).toBe('alice');
    expect(result.command).toBe('');
  });

  it('should work with different node types', async () => {
    // Create a network with different node types
    await store.getActions().network.addNetwork({
      name: 'test-network',
      description: 'Test',
      lndNodes: 1,
      clightningNodes: 1,
      eclairNodes: 1,
      bitcoindNodes: 1,
      tapdNodes: 1,
      litdNodes: 1,
      customNodes: {},
      manualMineCount: 6,
    });

    const network = store.getState().network.networks[0];

    // Test with bitcoin node
    const bitcoinResult = await store.getActions().mcp.updateNodeCommand({
      networkId: network.id,
      nodeName: 'backend1',
      command: 'bitcoind -custom=flag',
    });

    expect(bitcoinResult.success).toBe(true);
    expect(bitcoinResult.nodeName).toBe('backend1');

    // Test with lightning node (eclair node should be 'carol')
    const lightningResult = await store.getActions().mcp.updateNodeCommand({
      networkId: network.id,
      nodeName: 'carol',
      command: 'eclair --custom-flag',
    });

    expect(lightningResult.success).toBe(true);
    expect(lightningResult.nodeName).toBe('carol');

    // Test with tap node - use the correct name
    const tapNodeNames = network.nodes.tap.map(n => n.name);
    expect(tapNodeNames.length).toBeGreaterThan(0);
    const tapNodeName = tapNodeNames[0];

    const tapResult = await store.getActions().mcp.updateNodeCommand({
      networkId: network.id,
      nodeName: tapNodeName,
      command: 'tapd --custom-flag',
    });

    expect(tapResult.success).toBe(true);
    expect(tapResult.nodeName).toBe(tapNodeName);
  });

  it('should throw error when networkId is missing', async () => {
    await expect(
      store.getActions().mcp.updateNodeCommand({
        nodeName: 'alice',
        command: 'test command',
      } as any),
    ).rejects.toThrow('Network ID is required');
  });

  it('should throw error when nodeName is missing', async () => {
    await expect(
      store.getActions().mcp.updateNodeCommand({
        networkId: 1,
        command: 'test command',
      } as any),
    ).rejects.toThrow('Node name is required');
  });

  it('should throw error when command is undefined', async () => {
    await expect(
      store.getActions().mcp.updateNodeCommand({
        networkId: 1,
        nodeName: 'alice',
      } as any),
    ).rejects.toThrow('Command is required (use empty string to reset to default)');
  });

  it('should throw error when network does not exist', async () => {
    await expect(
      store.getActions().mcp.updateNodeCommand({
        networkId: 9999,
        nodeName: 'alice',
        command: 'test command',
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
      store.getActions().mcp.updateNodeCommand({
        networkId: network.id,
        nodeName: 'nonexistent',
        command: 'test command',
      }),
    ).rejects.toThrow('Node "nonexistent" not found in network "test-network"');
  });
});
