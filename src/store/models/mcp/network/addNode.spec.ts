import { createStore } from 'easy-peasy';
import { Status } from 'shared/types';
import { createMockRootModel, getNetwork, injections } from 'utils/tests';

describe('MCP model > addNode', () => {
  const rootModel = createMockRootModel();

  // initialize store for type inference
  let store = createStore(rootModel, { injections });

  beforeEach(() => {
    // reset the store before each test run
    store = createStore(rootModel, { injections });
    jest.clearAllMocks();

    // Create a test network
    store.getState().network.networks = [getNetwork(1, 'test-network')];
  });

  describe('Bitcoin nodes', () => {
    it('should add a Bitcoin node to network', async () => {
      const result = await store.getActions().mcp.addNode({
        networkId: 1,
        implementation: 'bitcoind',
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain('Bitcoin Core node');
      expect(result.message).toContain('added to network');
      expect(result.message).toContain('successfully');
      expect(result.node).toBeDefined();
      expect(result.node.name).toBeDefined();
    });

    it('should add a Bitcoin node with specific version', async () => {
      const result = await store.getActions().mcp.addNode({
        networkId: 1,
        implementation: 'bitcoind',
        version: '29.0',
      });

      expect(result.success).toBe(true);
      expect(result.node).toBeDefined();
    });

    it('should throw error when Bitcoin version is not supported', async () => {
      await expect(
        store.getActions().mcp.addNode({
          networkId: 1,
          implementation: 'bitcoind',
          version: '0.21.1',
        }),
      ).rejects.toThrow(
        "Version '0.21.1' is not supported for bitcoind. Supported versions:",
      );
    });
  });

  describe('Lightning nodes', () => {
    it('should add an LND node to network', async () => {
      const result = await store.getActions().mcp.addNode({
        networkId: 1,
        implementation: 'LND',
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain('LND node');
      expect(result.message).toContain('added to network');
      expect(result.message).toContain('successfully');
      expect(result.node).toBeDefined();
    });

    it('should add a c-lightning node to network', async () => {
      const result = await store.getActions().mcp.addNode({
        networkId: 1,
        implementation: 'c-lightning',
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain('c-lightning node');
      expect(result.node).toBeDefined();
    });

    it('should add an eclair node to network', async () => {
      const result = await store.getActions().mcp.addNode({
        networkId: 1,
        implementation: 'eclair',
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain('eclair node');
      expect(result.node).toBeDefined();
    });

    it('should add a litd node to network', async () => {
      const result = await store.getActions().mcp.addNode({
        networkId: 1,
        implementation: 'litd',
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain('litd node');
      expect(result.node).toBeDefined();
    });

    it('should add a Lightning node with specific version', async () => {
      const result = await store.getActions().mcp.addNode({
        networkId: 1,
        implementation: 'LND',
        version: '0.19.2-beta',
      });

      expect(result.success).toBe(true);
      expect(result.node).toBeDefined();
    });

    it('should throw error when Lightning version is not supported', async () => {
      await expect(
        store.getActions().mcp.addNode({
          networkId: 1,
          implementation: 'LND',
          version: '0.15.0-beta',
        }),
      ).rejects.toThrow(
        "Version '0.15.0-beta' is not supported for LND. Supported versions:",
      );
    });

    it('should throw error when implementation is not supported', async () => {
      await expect(
        store.getActions().mcp.addNode({
          networkId: 1,
          implementation: 'unsupported-impl' as any,
        }),
      ).rejects.toThrow(`Unsupported implementation 'unsupported-impl'`);
    });
  });

  it('should throw error when networkId is missing', async () => {
    await expect(
      store.getActions().mcp.addNode({
        networkId: 0,
        implementation: 'bitcoind',
      }),
    ).rejects.toThrow('Network ID is required');
  });

  it('should throw error when networkId is not provided', async () => {
    await expect(store.getActions().mcp.addNode({} as any)).rejects.toThrow(
      'Network ID is required',
    );
  });

  it('should throw error when implementation is not provided', async () => {
    await expect(
      store.getActions().mcp.addNode({
        networkId: 1,
      } as any),
    ).rejects.toThrow('Implementation is required');
  });

  it('should throw error when network does not exist', async () => {
    await expect(
      store.getActions().mcp.addNode({
        networkId: 999,
        implementation: 'bitcoind',
      }),
    ).rejects.toThrow('Network with ID 999 not found');
  });

  it('should add node to the network store', async () => {
    const initialNetwork = store.getState().network.networks[0];
    const initialBitcoinCount = initialNetwork.nodes.bitcoin.length;

    await store.getActions().mcp.addNode({
      networkId: 1,
      implementation: 'bitcoind',
    });

    const updatedNetwork = store.getState().network.networks[0];
    expect(updatedNetwork.nodes.bitcoin.length).toBe(initialBitcoinCount + 1);
  });

  it('should toggle node when network is started', async () => {
    // Spy on the toggleNode action to avoid actual service calls
    const toggleNodeSpy = jest.spyOn(store.getActions().network, 'toggleNode');
    toggleNodeSpy.mockResolvedValue(undefined);

    // Create a started network
    store.getState().network.networks = [getNetwork(1, 'test-network', Status.Started)];

    const result = await store.getActions().mcp.addNode({
      networkId: 1,
      implementation: 'bitcoind',
    });

    expect(result.success).toBe(true);
    expect(result.node).toBeDefined();
    expect(toggleNodeSpy).toHaveBeenCalledWith(result.node);

    toggleNodeSpy.mockRestore();
  });
});
