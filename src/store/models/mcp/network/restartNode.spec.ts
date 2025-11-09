import { createStore } from 'easy-peasy';
import { Status } from 'shared/types';
import { createMockRootModel, injections } from 'utils/tests';

describe('MCP model > restartNode', () => {
  const rootModel = createMockRootModel();

  // initialize store for type inference
  let store = createStore(rootModel, { injections });

  beforeEach(() => {
    // reset the store before each test run
    store = createStore(rootModel, { injections });
    jest.clearAllMocks();
  });

  it('should restart a Bitcoin node', async () => {
    const toggleNodeSpy = jest.spyOn(store.getActions().network, 'toggleNode');
    toggleNodeSpy.mockImplementation(async node => {
      // Simulate the toggleNode behavior by changing the node status
      const network = store
        .getState()
        .network.networks.find(n => n.id === node.networkId);
      if (network) {
        const foundNode = [
          ...network.nodes.bitcoin,
          ...network.nodes.lightning,
          ...network.nodes.tap,
        ].find(n => n.name === node.name);
        if (foundNode) {
          if (foundNode.status === Status.Started) {
            foundNode.status = Status.Stopped;
          } else if (foundNode.status === Status.Stopped) {
            foundNode.status = Status.Started;
          } else if (foundNode.status === Status.Error) {
            foundNode.status = Status.Started;
          }
        }
      }
    });

    // Create a network with 1 Bitcoin node
    await store.getActions().network.addNetwork({
      name: 'test-network',
      description: 'Test',
      lndNodes: 0,
      clightningNodes: 0,
      eclairNodes: 0,
      bitcoindNodes: 1,
      tapdNodes: 0,
      litdNodes: 0,
      customNodes: {},
      manualMineCount: 6,
    });

    const network = store.getState().network.networks[0];
    const node = network.nodes.bitcoin[0];
    const nodeName = node.name;

    // Change node status to Started so it can be restarted
    node.status = Status.Started;

    const result = await store.getActions().mcp.restartNode({
      networkId: network.id,
      nodeName,
    });

    expect(result.success).toBe(true);
    expect(result.message).toBe(`Node "${nodeName}" restarted successfully`);
    expect(result.networkId).toBe(network.id);
    expect(result.nodeName).toBe(nodeName);
    expect(result.nodeStatus).toBe(Status.Started);
    expect(toggleNodeSpy).toHaveBeenCalledTimes(2);

    toggleNodeSpy.mockRestore();
  });

  it('should restart a Lightning node', async () => {
    const toggleNodeSpy = jest.spyOn(store.getActions().network, 'toggleNode');
    toggleNodeSpy.mockImplementation(async node => {
      // Simulate the toggleNode behavior by changing the node status
      const network = store
        .getState()
        .network.networks.find(n => n.id === node.networkId);
      if (network) {
        const foundNode = [
          ...network.nodes.bitcoin,
          ...network.nodes.lightning,
          ...network.nodes.tap,
        ].find(n => n.name === node.name);
        if (foundNode) {
          if (foundNode.status === Status.Started) {
            foundNode.status = Status.Stopped;
          } else if (foundNode.status === Status.Stopped) {
            foundNode.status = Status.Started;
          } else if (foundNode.status === Status.Error) {
            foundNode.status = Status.Started;
          }
        }
      }
    });

    // Create a network with 1 Lightning node
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
    const node = network.nodes.lightning[0];
    const nodeName = node.name;

    // Change node status to Started so it can be restarted
    node.status = Status.Started;

    const result = await store.getActions().mcp.restartNode({
      networkId: network.id,
      nodeName,
    });

    expect(result.success).toBe(true);
    expect(result.message).toBe(`Node "${nodeName}" restarted successfully`);
    expect(result.networkId).toBe(network.id);
    expect(result.nodeName).toBe(nodeName);
    expect(result.nodeStatus).toBe(Status.Started);
    expect(toggleNodeSpy).toHaveBeenCalledTimes(2);

    toggleNodeSpy.mockRestore();
  });

  it('should restart a Tap node', async () => {
    const toggleNodeSpy = jest.spyOn(store.getActions().network, 'toggleNode');
    toggleNodeSpy.mockImplementation(async node => {
      // Simulate the toggleNode behavior by changing the node status
      const network = store
        .getState()
        .network.networks.find(n => n.id === node.networkId);
      if (network) {
        const foundNode = [
          ...network.nodes.bitcoin,
          ...network.nodes.lightning,
          ...network.nodes.tap,
        ].find(n => n.name === node.name);
        if (foundNode) {
          if (foundNode.status === Status.Started) {
            foundNode.status = Status.Stopped;
          } else if (foundNode.status === Status.Stopped) {
            foundNode.status = Status.Started;
          } else if (foundNode.status === Status.Error) {
            foundNode.status = Status.Started;
          }
        }
      }
    });

    // Create a network with 1 Tap node (requires LND node too)
    await store.getActions().network.addNetwork({
      name: 'test-network',
      description: 'Test',
      lndNodes: 1,
      clightningNodes: 0,
      eclairNodes: 0,
      bitcoindNodes: 1,
      tapdNodes: 1,
      litdNodes: 0,
      customNodes: {},
      manualMineCount: 6,
    });

    const network = store.getState().network.networks[0];
    const node = network.nodes.tap[0];
    const nodeName = node.name;

    // Change node status to Started so it can be restarted
    node.status = Status.Started;

    const result = await store.getActions().mcp.restartNode({
      networkId: network.id,
      nodeName,
    });

    expect(result.success).toBe(true);
    expect(result.message).toBe(`Node "${nodeName}" restarted successfully`);
    expect(result.networkId).toBe(network.id);
    expect(result.nodeName).toBe(nodeName);
    expect(result.nodeStatus).toBe(Status.Started);
    expect(toggleNodeSpy).toHaveBeenCalledTimes(2);

    toggleNodeSpy.mockRestore();
  });

  it('should restart a node that is in Error state', async () => {
    const toggleNodeSpy = jest.spyOn(store.getActions().network, 'toggleNode');
    toggleNodeSpy.mockImplementation(async node => {
      // Simulate the toggleNode behavior by changing the node status
      const network = store
        .getState()
        .network.networks.find(n => n.id === node.networkId);
      if (network) {
        const foundNode = [
          ...network.nodes.bitcoin,
          ...network.nodes.lightning,
          ...network.nodes.tap,
        ].find(n => n.name === node.name);
        if (foundNode) {
          if (foundNode.status === Status.Started) {
            foundNode.status = Status.Stopped;
          } else if (foundNode.status === Status.Stopped) {
            foundNode.status = Status.Started;
          } else if (foundNode.status === Status.Error) {
            foundNode.status = Status.Started;
          }
        }
      }
    });

    // Create a network with 1 Bitcoin node
    await store.getActions().network.addNetwork({
      name: 'test-network',
      description: 'Test',
      lndNodes: 0,
      clightningNodes: 0,
      eclairNodes: 0,
      bitcoindNodes: 1,
      tapdNodes: 0,
      litdNodes: 0,
      customNodes: {},
      manualMineCount: 6,
    });

    // Change node status to Error
    const network = store.getState().network.networks[0];
    network.nodes.bitcoin[0].status = Status.Error;
    const nodeName = network.nodes.bitcoin[0].name;

    const result = await store.getActions().mcp.restartNode({
      networkId: network.id,
      nodeName,
    });

    expect(result.success).toBe(true);
    expect(result.message).toBe(`Node "${nodeName}" restarted successfully`);
    expect(toggleNodeSpy).toHaveBeenCalledTimes(2);

    toggleNodeSpy.mockRestore();
  });

  it('should throw error when networkId is not provided', async () => {
    await expect(store.getActions().mcp.restartNode({} as any)).rejects.toThrow(
      'Network ID is required',
    );
  });

  it('should throw error when nodeName is not provided', async () => {
    await expect(
      store.getActions().mcp.restartNode({
        networkId: 1,
      } as any),
    ).rejects.toThrow('Node name is required');
  });

  it('should throw error when network does not exist', async () => {
    await expect(
      store.getActions().mcp.restartNode({
        networkId: 999,
        nodeName: 'alice-lnd',
      }),
    ).rejects.toThrow("Network with the id '999' was not found.");
  });

  it('should throw error when node does not exist', async () => {
    // Create a network first
    await store.getActions().network.addNetwork({
      name: 'test-network',
      description: 'Test',
      lndNodes: 0,
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
      store.getActions().mcp.restartNode({
        networkId: network.id,
        nodeName: 'nonexistent-node',
      }),
    ).rejects.toThrow('Node "nonexistent-node" not found in network "test-network"');
  });

  it('should throw error when node is stopped', async () => {
    // Create a network first
    await store.getActions().network.addNetwork({
      name: 'test-network',
      description: 'Test',
      lndNodes: 0,
      clightningNodes: 0,
      eclairNodes: 0,
      bitcoindNodes: 1,
      tapdNodes: 0,
      litdNodes: 0,
      customNodes: {},
      manualMineCount: 6,
    });

    // Node is already in Stopped state by default
    const network = store.getState().network.networks[0];
    const nodeName = network.nodes.bitcoin[0].name;

    await expect(
      store.getActions().mcp.restartNode({
        networkId: network.id,
        nodeName,
      }),
    ).rejects.toThrow(
      `Cannot restart node "${nodeName}". Node is currently Stopped. Only Started or Error nodes can be restarted.`,
    );
  });

  it('should throw error when node is starting', async () => {
    // Create a network first
    await store.getActions().network.addNetwork({
      name: 'test-network',
      description: 'Test',
      lndNodes: 0,
      clightningNodes: 0,
      eclairNodes: 0,
      bitcoindNodes: 1,
      tapdNodes: 0,
      litdNodes: 0,
      customNodes: {},
      manualMineCount: 6,
    });

    // Change node status to Starting
    const network = store.getState().network.networks[0];
    network.nodes.bitcoin[0].status = Status.Starting;
    const nodeName = network.nodes.bitcoin[0].name;

    await expect(
      store.getActions().mcp.restartNode({
        networkId: network.id,
        nodeName,
      }),
    ).rejects.toThrow(
      `Cannot restart node "${nodeName}". Node is currently Starting. Only Started or Error nodes can be restarted.`,
    );
  });

  it('should throw error when node is stopping', async () => {
    // Create a network first
    await store.getActions().network.addNetwork({
      name: 'test-network',
      description: 'Test',
      lndNodes: 0,
      clightningNodes: 0,
      eclairNodes: 0,
      bitcoindNodes: 1,
      tapdNodes: 0,
      litdNodes: 0,
      customNodes: {},
      manualMineCount: 6,
    });

    // Change node status to Stopping
    const network = store.getState().network.networks[0];
    network.nodes.bitcoin[0].status = Status.Stopping;
    const nodeName = network.nodes.bitcoin[0].name;

    await expect(
      store.getActions().mcp.restartNode({
        networkId: network.id,
        nodeName,
      }),
    ).rejects.toThrow(
      `Cannot restart node "${nodeName}". Node is currently Stopping. Only Started or Error nodes can be restarted.`,
    );
  });
});
