import { createStore } from 'easy-peasy';
import {
  bitcoinServiceMock,
  createMockRootModel,
  injections,
  lightningServiceMock,
} from 'utils/tests';

describe('MCP model > getNewBitcoinAddress', () => {
  const rootModel = createMockRootModel();

  // initialize store for type inference
  let store = createStore(rootModel, { injections });

  beforeEach(() => {
    // reset the store before each test run
    store = createStore(rootModel, { injections });
    jest.clearAllMocks();
  });

  it('should get new Bitcoin address from Bitcoin node successfully', async () => {
    // Create a network with Bitcoin node
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
    const mockAddress = 'bcrt1qxyz123abc456def789';
    bitcoinServiceMock.getNewAddress.mockResolvedValue(mockAddress);

    const result = await store.getActions().mcp.getNewBitcoinAddress({
      networkId: network.id,
      nodeName: 'backend1',
    });

    expect(result.success).toBe(true);
    expect(result.message).toContain(
      `Generated new Bitcoin address for "backend1": ${mockAddress}`,
    );
    expect(result.networkId).toBe(network.id);
    expect(result.nodeName).toBe('backend1');
    expect(result.address).toBe(mockAddress);
    expect(result.nodeType).toBe('bitcoin');

    expect(bitcoinServiceMock.getNewAddress).toHaveBeenCalledWith(
      network.nodes.bitcoin[0],
    );
  });

  it('should get new Bitcoin address from Lightning node successfully', async () => {
    // Create a network with Lightning node and compatible Bitcoin node
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
    const mockAddress = 'bcrt1qlnd789ghi012jkl345';
    lightningServiceMock.getNewAddress.mockResolvedValue({ address: mockAddress });

    const result = await store.getActions().mcp.getNewBitcoinAddress({
      networkId: network.id,
      nodeName: 'alice',
    });

    expect(result.success).toBe(true);
    expect(result.message).toContain(
      `Generated new Bitcoin address for "alice": ${mockAddress}`,
    );
    expect(result.networkId).toBe(network.id);
    expect(result.nodeName).toBe('alice');
    expect(result.address).toBe(mockAddress);
    expect(result.nodeType).toBe('lightning');

    expect(lightningServiceMock.getNewAddress).toHaveBeenCalledWith(
      network.nodes.lightning[0],
    );
  });

  it('should get new Bitcoin address from default node when nodeName not specified (Bitcoin node)', async () => {
    // Create a network with Bitcoin node
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
    const mockAddress = 'bcrt1qdefaultnodeaddress';
    bitcoinServiceMock.getNewAddress.mockResolvedValue(mockAddress);

    const result = await store.getActions().mcp.getNewBitcoinAddress({
      networkId: network.id,
    });

    expect(result.success).toBe(true);
    expect(result.nodeName).toBe('backend1');
    expect(result.address).toBe(mockAddress);
    expect(result.nodeType).toBe('bitcoin');

    expect(bitcoinServiceMock.getNewAddress).toHaveBeenCalledWith(
      network.nodes.bitcoin[0],
    );
  });

  it('should get new Bitcoin address from default node when nodeName not specified (Lightning node)', async () => {
    // Create a network with Lightning node and compatible Bitcoin node
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
    const mockAddress = 'bcrt1qlightningdefault';
    bitcoinServiceMock.getNewAddress.mockResolvedValue(mockAddress);

    const result = await store.getActions().mcp.getNewBitcoinAddress({
      networkId: network.id,
    });

    expect(result.success).toBe(true);
    expect(result.nodeName).toBe('backend1'); // Bitcoin nodes are preferred over Lightning nodes
    expect(result.address).toBe(mockAddress);
    expect(result.nodeType).toBe('bitcoin');

    expect(bitcoinServiceMock.getNewAddress).toHaveBeenCalledWith(
      network.nodes.bitcoin[0],
    );
    expect(bitcoinServiceMock.getNewAddress).toHaveBeenCalledTimes(1);
  });

  it('should handle Lightning node returning address object', async () => {
    // Create a network with Lightning node and compatible Bitcoin node
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
    const mockAddressObject = { address: 'bcrt1qfromobject123' };
    lightningServiceMock.getNewAddress.mockResolvedValue(mockAddressObject as any);

    const result = await store.getActions().mcp.getNewBitcoinAddress({
      networkId: network.id,
      nodeName: 'alice',
    });

    expect(result.success).toBe(true);
    expect(result.address).toBe('bcrt1qfromobject123');
  });

  it('should throw error when networkId is missing', async () => {
    await expect(store.getActions().mcp.getNewBitcoinAddress({} as any)).rejects.toThrow(
      'Network ID is required',
    );
  });

  it('should throw error when network does not exist', async () => {
    await expect(
      store.getActions().mcp.getNewBitcoinAddress({
        networkId: 9999,
      }),
    ).rejects.toThrow("Network with the id '9999' was not found");
  });

  it('should throw error when specified node does not exist', async () => {
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
      store.getActions().mcp.getNewBitcoinAddress({
        networkId: network.id,
        nodeName: 'nonexistent-node',
      }),
    ).rejects.toThrow('Lightning node "nonexistent-node" not found in network');
  });

  it('should throw error when network has no Bitcoin or Lightning nodes', async () => {
    await store.getActions().network.addNetwork({
      name: 'test-network',
      description: 'Test',
      lndNodes: 0,
      clightningNodes: 0,
      eclairNodes: 0,
      bitcoindNodes: 0,
      tapdNodes: 0,
      litdNodes: 0,
      customNodes: {},
      manualMineCount: 6,
    });

    const network = store.getState().network.networks[0];
    await expect(
      store.getActions().mcp.getNewBitcoinAddress({
        networkId: network.id,
      }),
    ).rejects.toThrow('Network has no Bitcoin or Lightning nodes');
  });

  it('should use Lightning node when no Bitcoin nodes exist in network', async () => {
    // Create a valid network with both Bitcoin and Lightning nodes
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

    // Manually modify the network to remove Bitcoin nodes to simulate the error condition
    const modifiedNetwork = {
      ...network,
      nodes: {
        ...network.nodes,
        bitcoin: [], // Remove all Bitcoin nodes
      },
    };

    // Update the store state directly
    store.getState().network.networks[0] = modifiedNetwork;

    const mockAddress = 'bcrt1qonlylightningnode';
    lightningServiceMock.getNewAddress.mockResolvedValue({ address: mockAddress });

    const result = await store.getActions().mcp.getNewBitcoinAddress({
      networkId: network.id,
    });

    expect(result.success).toBe(true);
    expect(result.nodeName).toBe('alice');
    expect(result.address).toBe(mockAddress);
    expect(result.nodeType).toBe('lightning');

    expect(lightningServiceMock.getNewAddress).toHaveBeenCalledWith(
      network.nodes.lightning[0],
    );
  });
});
