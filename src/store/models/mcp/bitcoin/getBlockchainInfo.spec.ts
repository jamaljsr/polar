import { createStore } from 'easy-peasy';
import { bitcoinServiceMock, createMockRootModel, injections } from 'utils/tests';

describe('MCP model > getBlockchainInfo', () => {
  const rootModel = createMockRootModel();

  // initialize store for type inference
  let store = createStore(rootModel, { injections });

  beforeEach(() => {
    // reset the store before each test run
    store = createStore(rootModel, { injections });
    jest.clearAllMocks();
    // Mock getBlockchainInfo to return chain info
    bitcoinServiceMock.getBlockchainInfo.mockResolvedValue({
      chain: 'regtest',
      blocks: 100,
      headers: 100,
      bestblockhash: '0x1234567890abcdef',
      difficulty: 1,
      mediantime: 1640000000,
      verificationprogress: 1,
      initialblockdownload: false,
      chainwork: '0x00000000000000000000000000000000000000000000000000000001',
      size_on_disk: 1024,
      pruned: false,
      pruneheight: 0,
      automatic_pruning: false,
      prune_target_size: 0,
      softforks: [],
      bip9_softforks: [],
    });
  });

  it('should get blockchain info from default node', async () => {
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
    const result = await store.getActions().mcp.getBlockchainInfo({
      networkId: network.id,
    });

    expect(result.success).toBe(true);
    expect(result.nodeName).toBe('backend1');
    expect(result.chain).toBe('regtest');
    expect(result.blocks).toBe(100);
    expect(result.headers).toBe(100);
    expect(result.bestblockhash).toBe('0x1234567890abcdef');
    expect(result.difficulty).toBe(1);
    expect(result.mediantime).toBe(1640000000);
    expect(result.verificationprogress).toBe(1);
  });

  it('should get blockchain info from specified node', async () => {
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
    const result = await store.getActions().mcp.getBlockchainInfo({
      networkId: network.id,
      nodeName: 'backend2',
    });

    expect(result.success).toBe(true);
    expect(result.nodeName).toBe('backend2');
    expect(result.chain).toBe('regtest');
    expect(result.blocks).toBe(100);
  });

  it('should throw error when networkId is missing', async () => {
    await expect(store.getActions().mcp.getBlockchainInfo({} as any)).rejects.toThrow(
      'Network ID is required',
    );
  });

  it('should throw error when network does not exist', async () => {
    await expect(
      store.getActions().mcp.getBlockchainInfo({ networkId: 9999 }),
    ).rejects.toThrow("Network with the id '9999' was not found");
  });

  it('should throw error when network has no bitcoin nodes', async () => {
    await store.getActions().network.addNetwork({
      name: 'test-network',
      description: 'Test',
      lndNodes: 0,
      clightningNodes: 0,
      eclairNodes: 0,
      bitcoindNodes: 0, // No bitcoin nodes
      btcdNodes: 0,
      tapdNodes: 0,
      litdNodes: 0,
      customNodes: {},
      manualMineCount: 6,
    });

    const network = store.getState().network.networks[0];
    await expect(
      store.getActions().mcp.getBlockchainInfo({ networkId: network.id }),
    ).rejects.toThrow('Network has no Bitcoin nodes');
  });

  it('should throw error when specified node does not exist', async () => {
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
      store.getActions().mcp.getBlockchainInfo({
        networkId: network.id,
        nodeName: 'nonexistent-node',
      }),
    ).rejects.toThrow('Bitcoin node "nonexistent-node" not found in network');
  });

  it('should throw error when blockchain info retrieval fails', async () => {
    // Mock getBlockchainInfo to not populate the state properly
    bitcoinServiceMock.getBlockchainInfo.mockResolvedValue(undefined as any);

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
      store.getActions().mcp.getBlockchainInfo({ networkId: network.id }),
    ).rejects.toThrow('Failed to retrieve blockchain info');
  });
});
