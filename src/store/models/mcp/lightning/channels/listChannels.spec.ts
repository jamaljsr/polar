import { createStore } from 'easy-peasy';
import { LightningNodeChannel } from 'lib/lightning/types';
import { createMockRootModel, injections, lightningServiceMock } from 'utils/tests';

describe('MCP model > listChannels', () => {
  const rootModel = createMockRootModel();

  // initialize store for type inference
  let store = createStore(rootModel, { injections });

  const mockChannels: LightningNodeChannel[] = [
    {
      pending: false,
      uniqueId: 'chan1',
      channelPoint: 'abc123:0',
      pubkey: '02pubkey1',
      capacity: '1000000',
      localBalance: '500000',
      remoteBalance: '500000',
      status: 'Open',
      isPrivate: false,
    },
    {
      pending: true,
      uniqueId: 'chan2',
      channelPoint: 'def456:1',
      pubkey: '02pubkey2',
      capacity: '2000000',
      localBalance: '1000000',
      remoteBalance: '1000000',
      status: 'Opening',
      isPrivate: true,
    },
  ];

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
    lightningServiceMock.getChannels.mockResolvedValue(mockChannels);
  });

  it('should list channels successfully', async () => {
    // Create a network with 1 LND node
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
    const nodeName = network.nodes.lightning[0].name;

    const result = await store.getActions().mcp.listChannels({
      networkId: network.id,
      nodeName,
    });

    expect(result.success).toBe(true);
    expect(result.message).toContain('Found 2 channels');
    expect(result.message).toContain(nodeName);
    expect(result.networkId).toBe(network.id);
    expect(result.nodeName).toBe(nodeName);
    expect(result.channels).toHaveLength(2);
    expect(result.channels[0].channelPoint).toBe('abc123:0');
    expect(result.channels[0].capacity).toBe('1000000');
    expect(result.channels[0].localBalance).toBe('500000');
    expect(result.channels[0].remoteBalance).toBe('500000');
    expect(result.channels[0].status).toBe('Open');
    expect(result.channels[0].isPrivate).toBe(false);
    expect(result.channels[1].channelPoint).toBe('def456:1');
    expect(result.channels[1].status).toBe('Opening');
    expect(result.channels[1].isPrivate).toBe(true);
  });

  it('should handle no channels', async () => {
    lightningServiceMock.getChannels.mockResolvedValue([]);

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
    const nodeName = network.nodes.lightning[0].name;

    const result = await store.getActions().mcp.listChannels({
      networkId: network.id,
      nodeName,
    });

    expect(result.success).toBe(true);
    expect(result.message).toContain('Found 0 channels');
    expect(result.message).toContain(nodeName);
    expect(result.channels).toHaveLength(0);
  });

  it('should return zero channels when no model state is found', async () => {
    lightningServiceMock.getChannels.mockResolvedValue(undefined as any);

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
    const nodeName = network.nodes.lightning[0].name;

    const result = await store.getActions().mcp.listChannels({
      networkId: network.id,
      nodeName,
    });

    expect(result.success).toBe(true);
    expect(result.channels).toHaveLength(0);
  });

  it('should handle singular channel message', async () => {
    lightningServiceMock.getChannels.mockResolvedValue([mockChannels[0]]);

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
    const nodeName = network.nodes.lightning[0].name;

    const result = await store.getActions().mcp.listChannels({
      networkId: network.id,
      nodeName,
    });

    expect(result.success).toBe(true);
    expect(result.message).toContain('Found 1 channel');
    expect(result.message).not.toContain('channels');
    expect(result.channels).toHaveLength(1);
  });

  it('should throw error when networkId is missing', async () => {
    await expect(
      store.getActions().mcp.listChannels({
        nodeName: 'alice',
      } as any),
    ).rejects.toThrow('Network ID is required');
  });

  it('should throw error when nodeName is missing', async () => {
    await expect(
      store.getActions().mcp.listChannels({
        networkId: 1,
      } as any),
    ).rejects.toThrow('Node name is required');
  });

  it('should throw error when network does not exist', async () => {
    await expect(
      store.getActions().mcp.listChannels({
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
      btcdNodes: 0,
      tapdNodes: 0,
      litdNodes: 0,
      customNodes: {},
      manualMineCount: 6,
    });

    const network = store.getState().network.networks[0];

    await expect(
      store.getActions().mcp.listChannels({
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
      btcdNodes: 0,
      tapdNodes: 0,
      litdNodes: 0,
      customNodes: {},
      manualMineCount: 6,
    });

    const network = store.getState().network.networks[0];
    const nodeName = network.nodes.lightning[0].name;

    const result = await store.getActions().mcp.listChannels({
      networkId: network.id,
      nodeName,
    });

    expect(result.success).toBe(true);
    expect(result.channels).toHaveLength(2);
  });

  it('should work with eclair nodes', async () => {
    await store.getActions().network.addNetwork({
      name: 'test-network',
      description: 'Test',
      lndNodes: 0,
      clightningNodes: 0,
      eclairNodes: 1,
      bitcoindNodes: 1,
      btcdNodes: 0,
      tapdNodes: 0,
      litdNodes: 0,
      customNodes: {},
      manualMineCount: 6,
    });

    const network = store.getState().network.networks[0];
    const nodeName = network.nodes.lightning[0].name;

    const result = await store.getActions().mcp.listChannels({
      networkId: network.id,
      nodeName,
    });

    expect(result.success).toBe(true);
    expect(result.channels).toHaveLength(2);
  });

  it('should include channels where node is the peer', async () => {
    // Create a network with 2 LND nodes
    await store.getActions().network.addNetwork({
      name: 'test-network',
      description: 'Test',
      lndNodes: 2,
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
    const aliceNode = network.nodes.lightning.find(n => n.name.includes('alice'))!;

    // Mock Alice's info and channels (Alice initiated a channel to Bob)
    lightningServiceMock.getInfo.mockImplementation(node => {
      if (node.name === aliceNode.name) {
        return Promise.resolve({
          pubkey: '02alice123',
          alias: 'alice',
          rpcUrl: 'alice@localhost:9735',
          syncedToChain: true,
          blockHeight: 100,
          numPendingChannels: 0,
          numActiveChannels: 1,
          numInactiveChannels: 0,
        });
      } else {
        return Promise.resolve({
          pubkey: '02bob456',
          alias: 'bob',
          rpcUrl: 'bob@localhost:9736',
          syncedToChain: true,
          blockHeight: 100,
          numPendingChannels: 0,
          numActiveChannels: 1,
          numInactiveChannels: 0,
        });
      }
    });

    // Mock channels: Alice has a channel to Bob, Bob has a channel to Alice
    lightningServiceMock.getChannels.mockImplementation(node => {
      if (node.name === aliceNode.name) {
        return Promise.resolve([
          {
            pending: false,
            uniqueId: 'alice-to-bob',
            channelPoint: 'abc123:0',
            pubkey: '02bob456', // Alice's channel points to Bob
            capacity: '1000000',
            localBalance: '500000',
            remoteBalance: '500000',
            status: 'Open',
            isPrivate: false,
          },
        ]);
      } else {
        return Promise.resolve([
          {
            pending: false,
            uniqueId: 'bob-to-alice',
            channelPoint: 'def456:0',
            pubkey: '02alice123', // Bob's channel points to Alice
            capacity: '1000000',
            localBalance: '500000',
            remoteBalance: '500000',
            status: 'Open',
            isPrivate: false,
          },
        ]);
      }
    });

    // Test listing Alice's channels - should include both her initiated channel and the channel where she's the peer
    const result = await store.getActions().mcp.listChannels({
      networkId: network.id,
      nodeName: aliceNode.name,
    });

    expect(result.success).toBe(true);
    expect(result.channels).toHaveLength(2);
    expect(result.channels.map(c => c.uniqueId)).toEqual(
      expect.arrayContaining(['alice-to-bob', 'bob-to-alice']),
    );
  });

  it('should handle node info retrieval failure', async () => {
    // Create a fresh store for this test to avoid interference
    // const testStore = createStore(rootModel, { injections });

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
    const nodeName = network.nodes.lightning[0].name;

    // Mock getInfo to resolve but override the lightning actions to not set info
    lightningServiceMock.getInfo.mockResolvedValue({
      pubkey: '02test123',
      alias: 'test-node',
      rpcUrl: 'test-node@localhost:9735',
      syncedToChain: true,
      blockHeight: 100,
      numPendingChannels: 0,
      numActiveChannels: 0,
      numInactiveChannels: 0,
    });

    await store.getActions().lightning.getInfo(network.nodes.lightning[0]);

    // Test listing Alice's channels
    const result = await store.getActions().mcp.listChannels({
      networkId: network.id,
      nodeName,
    });

    expect(result.success).toBe(true);

    store
      .getActions()
      .lightning.setInfo({ node: network.nodes.lightning[0], info: undefined as any });
    // Mock getInfo to resolve with undefined
    lightningServiceMock.getInfo.mockResolvedValue(undefined as any);

    await expect(
      store.getActions().mcp.listChannels({
        networkId: network.id,
        nodeName,
      }),
    ).rejects.toThrow('Unable to retrieve info for node');
  });

  it('should handle channel fetching failure for some nodes', async () => {
    // Create a network with 2 LND nodes
    await store.getActions().network.addNetwork({
      name: 'test-network',
      description: 'Test',
      lndNodes: 2,
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
    const aliceNode = network.nodes.lightning.find(n => n.name.includes('alice'))!;
    // const bobNode = network.nodes.lightning.find(n => n.name.includes('bob'))!;

    // Mock Alice's info
    lightningServiceMock.getInfo.mockImplementation(node => {
      if (node.name === aliceNode.name) {
        return Promise.resolve({
          pubkey: '02alice123',
          alias: 'alice',
          rpcUrl: 'alice@localhost:9735',
          syncedToChain: true,
          blockHeight: 100,
          numPendingChannels: 0,
          numActiveChannels: 1,
          numInactiveChannels: 0,
        });
      } else {
        return Promise.resolve({
          pubkey: '02bob456',
          alias: 'bob',
          rpcUrl: 'bob@localhost:9736',
          syncedToChain: true,
          blockHeight: 100,
          numPendingChannels: 0,
          numActiveChannels: 1,
          numInactiveChannels: 0,
        });
      }
    });

    // Mock channels: Alice succeeds, Bob fails
    lightningServiceMock.getChannels.mockImplementation(node => {
      if (node.name === aliceNode.name) {
        return Promise.resolve([
          {
            pending: false,
            uniqueId: 'alice-to-bob',
            channelPoint: 'abc123:0',
            pubkey: '02bob456',
            capacity: '1000000',
            localBalance: '500000',
            remoteBalance: '500000',
            status: 'Open',
            isPrivate: false,
          },
        ]);
      } else {
        return Promise.reject(new Error('Failed to fetch channels'));
      }
    });

    // Test listing Alice's channels - should succeed despite Bob's failure
    const result = await store.getActions().mcp.listChannels({
      networkId: network.id,
      nodeName: aliceNode.name,
    });

    expect(result.success).toBe(true);
    expect(result.channels).toHaveLength(1);
    expect(result.channels[0].uniqueId).toBe('alice-to-bob');
  });

  it('should handle peer info retrieval failure', async () => {
    // Create a network with 2 LND nodes
    await store.getActions().network.addNetwork({
      name: 'test-network',
      description: 'Test',
      lndNodes: 2,
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
    const aliceNode = network.nodes.lightning.find(n => n.name.includes('alice'))!;

    // Mock Alice's info successfully, but make Bob's getInfo return undefined
    lightningServiceMock.getInfo.mockImplementation(node => {
      if (node.name === aliceNode.name) {
        return Promise.resolve({
          pubkey: '02alice123',
          alias: 'alice',
          rpcUrl: 'alice@localhost:9735',
          syncedToChain: true,
          blockHeight: 100,
          numPendingChannels: 0,
          numActiveChannels: 1,
          numInactiveChannels: 0,
        });
      } else {
        // Bob's getInfo returns undefined, which won't set info in state
        return Promise.resolve(undefined as any);
      }
    });

    // Mock channels: Bob has a channel to Alice
    lightningServiceMock.getChannels.mockImplementation(node => {
      if (node.name === aliceNode.name) {
        return Promise.resolve([]);
      } else {
        return Promise.resolve([
          {
            pending: false,
            uniqueId: 'bob-to-alice',
            channelPoint: 'def456:0',
            pubkey: '02alice123',
            capacity: '1000000',
            localBalance: '500000',
            remoteBalance: '500000',
            status: 'Open',
            isPrivate: false,
          },
        ]);
      }
    });

    // Test listing Alice's channels - should continue despite Bob's info being unavailable
    const result = await store.getActions().mcp.listChannels({
      networkId: network.id,
      nodeName: aliceNode.name,
    });

    expect(result.success).toBe(true);
    // Should not include Bob's channel because Bob's info couldn't be retrieved
    expect(result.channels).toHaveLength(0);
  });
});
