import { createStore } from 'easy-peasy';
import { Status } from 'shared/types';
import { createMockRootModel, getNetwork, injections } from 'utils/tests';

describe('MCP model > renameNode', () => {
  const rootModel = createMockRootModel();

  // initialize store for type inference
  let store = createStore(rootModel, { injections });

  beforeEach(() => {
    // reset the store before each test run
    store = createStore(rootModel, { injections });
    jest.clearAllMocks();

    // Create a test network with different types of nodes
    const network = getNetwork(1, 'test-network');
    network.nodes.lightning = [
      {
        id: 1,
        name: 'alice-lnd',
        type: 'lightning',
        implementation: 'LND',
        version: '0.18.0-beta',
        status: Status.Stopped,
        networkId: 1,
      } as any,
    ];
    network.nodes.bitcoin = [
      {
        id: 2,
        name: 'bitcoin-1',
        type: 'bitcoin',
        implementation: 'bitcoind',
        version: '25.0',
        status: Status.Stopped,
        networkId: 1,
      } as any,
    ];
    network.nodes.tap = [
      {
        id: 3,
        name: 'tap-1',
        type: 'tap',
        implementation: 'tapd',
        version: '0.3.0',
        status: Status.Stopped,
        networkId: 1,
        lndName: 'bob-lnd', // Different LND to avoid conflicts
      } as any,
    ];
    store.getState().network.networks = [network];
  });

  describe('Lightning nodes', () => {
    it('should rename a Lightning node in network', async () => {
      const renameNodeSpy = jest.spyOn(store.getActions().network, 'renameNode');
      renameNodeSpy.mockResolvedValue(undefined);

      const result = await store.getActions().mcp.renameNode({
        networkId: 1,
        oldName: 'alice-lnd',
        newName: 'alice-renamed',
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain(
        'Lightning node "alice-lnd" renamed to "alice-renamed" in network',
      );
      expect(result.message).toContain('successfully');
      expect(renameNodeSpy).toHaveBeenCalledWith({
        node: expect.objectContaining({
          name: 'alice-lnd',
          type: 'lightning',
          implementation: 'LND',
        }),
        newName: 'alice-renamed',
      });

      renameNodeSpy.mockRestore();
    });
  });

  describe('Bitcoin nodes', () => {
    it('should rename a Bitcoin node in network', async () => {
      const renameNodeSpy = jest.spyOn(store.getActions().network, 'renameNode');
      renameNodeSpy.mockResolvedValue(undefined);

      const result = await store.getActions().mcp.renameNode({
        networkId: 1,
        oldName: 'bitcoin-1',
        newName: 'bitcoin-renamed',
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain(
        'Bitcoin node "bitcoin-1" renamed to "bitcoin-renamed" in network',
      );
      expect(result.message).toContain('successfully');
      expect(renameNodeSpy).toHaveBeenCalledWith({
        node: expect.objectContaining({
          name: 'bitcoin-1',
          type: 'bitcoin',
          implementation: 'bitcoind',
        }),
        newName: 'bitcoin-renamed',
      });

      renameNodeSpy.mockRestore();
    });
  });

  describe('Taproot Asset nodes', () => {
    it('should rename a Taproot Asset node in network', async () => {
      const renameNodeSpy = jest.spyOn(store.getActions().network, 'renameNode');
      renameNodeSpy.mockResolvedValue(undefined);

      const result = await store.getActions().mcp.renameNode({
        networkId: 1,
        oldName: 'tap-1',
        newName: 'tap-renamed',
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain(
        'Taproot Asset node "tap-1" renamed to "tap-renamed" in network',
      );
      expect(result.message).toContain('successfully');
      expect(renameNodeSpy).toHaveBeenCalledWith({
        node: expect.objectContaining({
          name: 'tap-1',
          type: 'tap',
          implementation: 'tapd',
        }),
        newName: 'tap-renamed',
      });

      renameNodeSpy.mockRestore();
    });
  });

  it('should throw error when networkId is missing', async () => {
    await expect(
      store.getActions().mcp.renameNode({
        networkId: 0,
        oldName: 'alice-lnd',
        newName: 'alice-renamed',
      }),
    ).rejects.toThrow('Network ID is required');
  });

  it('should throw error when networkId is not provided', async () => {
    await expect(
      store.getActions().mcp.renameNode({
        oldName: 'alice-lnd',
        newName: 'alice-renamed',
      } as any),
    ).rejects.toThrow('Network ID is required');
  });

  it('should throw error when oldName is not provided', async () => {
    await expect(
      store.getActions().mcp.renameNode({
        networkId: 1,
        newName: 'alice-renamed',
      } as any),
    ).rejects.toThrow('Old node name is required');
  });

  it('should throw error when newName is not provided', async () => {
    await expect(
      store.getActions().mcp.renameNode({
        networkId: 1,
        oldName: 'alice-lnd',
      } as any),
    ).rejects.toThrow('New node name is required');
  });

  it('should throw error when newName contains invalid characters', async () => {
    await expect(
      store.getActions().mcp.renameNode({
        networkId: 1,
        oldName: 'alice-lnd',
        newName: 'alice@invalid',
      }),
    ).rejects.toThrow(
      'New node name must contain only letters, numbers, hyphens, and underscores',
    );
  });

  it('should throw error when network does not exist', async () => {
    await expect(
      store.getActions().mcp.renameNode({
        networkId: 999,
        oldName: 'alice-lnd',
        newName: 'alice-renamed',
      }),
    ).rejects.toThrow('Network with ID 999 not found');
  });

  it('should throw error when old node does not exist in network', async () => {
    await expect(
      store.getActions().mcp.renameNode({
        networkId: 1,
        oldName: 'nonexistent-node',
        newName: 'new-node',
      }),
    ).rejects.toThrow(
      'Node "nonexistent-node" not found in network "test-network". Available nodes:',
    );
  });

  it('should list available nodes when old node not found', async () => {
    await expect(
      store.getActions().mcp.renameNode({
        networkId: 1,
        oldName: 'nonexistent-node',
        newName: 'new-node',
      }),
    ).rejects.toThrow('alice-lnd, bitcoin-1, tap-1');
  });

  it('should throw error when new name is already taken', async () => {
    await expect(
      store.getActions().mcp.renameNode({
        networkId: 1,
        oldName: 'alice-lnd',
        newName: 'bitcoin-1', // This name already exists
      }),
    ).rejects.toThrow(
      'Node name "bitcoin-1" is already taken by another node in network "test-network"',
    );
  });

  it('should allow renaming to the same name (no-op)', async () => {
    const renameNodeSpy = jest.spyOn(store.getActions().network, 'renameNode');
    renameNodeSpy.mockResolvedValue(undefined);

    const result = await store.getActions().mcp.renameNode({
      networkId: 1,
      oldName: 'alice-lnd',
      newName: 'alice-lnd',
    });

    expect(result.success).toBe(true);
    expect(result.message).toContain(
      'Lightning node "alice-lnd" renamed to "alice-lnd" in network',
    );
    expect(renameNodeSpy).toHaveBeenCalledWith({
      node: expect.objectContaining({
        name: 'alice-lnd',
        type: 'lightning',
        implementation: 'LND',
      }),
      newName: 'alice-lnd',
    });

    renameNodeSpy.mockRestore();
  });
});
