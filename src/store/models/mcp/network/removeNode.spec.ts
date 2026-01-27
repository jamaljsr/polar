import { createStore } from 'easy-peasy';
import { Status } from 'shared/types';
import { createMockRootModel, getNetwork, injections } from 'utils/tests';

describe('MCP model > removeNode', () => {
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
      {
        id: 3,
        name: 'bitcoin-2',
        type: 'bitcoin',
        implementation: 'bitcoind',
        version: '25.0',
        status: Status.Stopped,
        networkId: 1,
      } as any,
    ];
    network.nodes.tap = [
      {
        id: 4,
        name: 'tap-1',
        type: 'tap',
        implementation: 'tapd',
        version: '0.3.0',
        status: Status.Stopped,
        networkId: 1,
        lndName: 'bob-lnd', // Different LND to avoid conflicts
      } as any,
    ];
    store.getActions().network.setNetworks([network]);
  });

  describe('Lightning nodes', () => {
    it('should remove a Lightning node from network', async () => {
      const removeLightningNodeSpy = jest.spyOn(
        store.getActions().network,
        'removeLightningNode',
      );
      removeLightningNodeSpy.mockResolvedValue(undefined);

      const result = await store.getActions().mcp.removeNode({
        networkId: 1,
        nodeName: 'alice-lnd',
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain('Lightning node "alice-lnd" removed from network');
      expect(result.message).toContain('successfully');
      expect(removeLightningNodeSpy).toHaveBeenCalledWith({
        node: expect.objectContaining({
          name: 'alice-lnd',
          type: 'lightning',
          implementation: 'LND',
        }),
      });

      removeLightningNodeSpy.mockRestore();
    });
  });

  describe('Bitcoin nodes', () => {
    it('should remove a Bitcoin node from network', async () => {
      const removeBitcoinNodeSpy = jest.spyOn(
        store.getActions().network,
        'removeBitcoinNode',
      );
      removeBitcoinNodeSpy.mockResolvedValue(undefined);

      const result = await store.getActions().mcp.removeNode({
        networkId: 1,
        nodeName: 'bitcoin-2',
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain('Bitcoin node "bitcoin-2" removed from network');
      expect(result.message).toContain('successfully');
      expect(removeBitcoinNodeSpy).toHaveBeenCalledWith({
        node: expect.objectContaining({
          name: 'bitcoin-2',
          type: 'bitcoin',
          implementation: 'bitcoind',
        }),
      });

      removeBitcoinNodeSpy.mockRestore();
    });
  });

  describe('Taproot Asset nodes', () => {
    it('should remove a Taproot Asset node from network', async () => {
      const removeTapNodeSpy = jest.spyOn(store.getActions().network, 'removeTapNode');
      removeTapNodeSpy.mockResolvedValue(undefined);

      const result = await store.getActions().mcp.removeNode({
        networkId: 1,
        nodeName: 'tap-1',
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain('Taproot Asset node "tap-1" removed from network');
      expect(result.message).toContain('successfully');
      expect(removeTapNodeSpy).toHaveBeenCalledWith({
        node: expect.objectContaining({
          name: 'tap-1',
          type: 'tap',
          implementation: 'tapd',
        }),
      });

      removeTapNodeSpy.mockRestore();
    });
  });

  it('should throw error when networkId is missing', async () => {
    await expect(
      store.getActions().mcp.removeNode({
        networkId: 0,
        nodeName: 'alice-lnd',
      }),
    ).rejects.toThrow('Network ID is required');
  });

  it('should throw error when networkId is not provided', async () => {
    await expect(store.getActions().mcp.removeNode({} as any)).rejects.toThrow(
      'Network ID is required',
    );
  });

  it('should throw error when nodeName is not provided', async () => {
    await expect(
      store.getActions().mcp.removeNode({
        networkId: 1,
      } as any),
    ).rejects.toThrow('Node name is required');
  });

  it('should throw error when network does not exist', async () => {
    await expect(
      store.getActions().mcp.removeNode({
        networkId: 999,
        nodeName: 'alice-lnd',
      }),
    ).rejects.toThrow('Network with ID 999 not found');
  });

  it('should throw error when node does not exist in network', async () => {
    await expect(
      store.getActions().mcp.removeNode({
        networkId: 1,
        nodeName: 'nonexistent-node',
      }),
    ).rejects.toThrow(
      'Node "nonexistent-node" not found in network "test-network". Available nodes:',
    );
  });

  it('should list available nodes when node not found', async () => {
    await expect(
      store.getActions().mcp.removeNode({
        networkId: 1,
        nodeName: 'nonexistent-node',
      }),
    ).rejects.toThrow('alice-lnd, bitcoin-1, bitcoin-2, tap-1');
  });

  it('should throw error for unsupported node type', async () => {
    // Modify the store state directly to set an invalid node type
    const networks = store.getState().network.networks;
    if (networks[0]?.nodes.lightning[0]) {
      // Force the node type to be invalid for testing the default case
      (networks[0].nodes.lightning[0] as any).type = 'invalid';
    }

    await expect(
      store.getActions().mcp.removeNode({
        networkId: 1,
        nodeName: 'alice-lnd',
      }),
    ).rejects.toThrow('Unsupported node type: invalid');
  });
});
