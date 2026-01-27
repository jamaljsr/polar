import { createStore } from 'easy-peasy';
import { bitcoinServiceMock, createMockRootModel, injections } from 'utils/tests';

describe('MCP model > getBitcoinWalletInfo', () => {
  const rootModel = createMockRootModel();

  // initialize store for type inference
  let store = createStore(rootModel, { injections });

  const mockWalletInfo = {
    balance: 5.25,
    txcount: 42,
    walletname: 'default',
    walletversion: 169900,
  } as any;

  beforeEach(() => {
    // reset the store before each test run
    store = createStore(rootModel, { injections });
    jest.clearAllMocks();
    bitcoinServiceMock.getBlockchainInfo.mockResolvedValue({
      chain: 'regtest',
      blocks: 100,
      headers: 100,
      bestblockhash: 'blockhash',
      difficulty: 1,
      mediantime: 1234567890,
      verificationprogress: 1,
    } as any);
    bitcoinServiceMock.getWalletInfo.mockResolvedValue(mockWalletInfo);
  });

  it('should get wallet info successfully with specified node', async () => {
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
    const nodeName = network.nodes.bitcoin[0].name;

    const result = await store.getActions().mcp.getBitcoinWalletInfo({
      networkId: network.id,
      nodeName,
    });

    expect(result.success).toBe(true);
    expect(result.nodeName).toBe(nodeName);
    expect(result.walletInfo.balance).toBe(5.25);
    expect(result.walletInfo.txcount).toBe(42);
  });

  it('should get wallet info successfully with default node', async () => {
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
    const expectedNodeName = network.nodes.bitcoin[0].name;

    const result = await store.getActions().mcp.getBitcoinWalletInfo({
      networkId: network.id,
    });

    expect(result.success).toBe(true);
    expect(result.nodeName).toBe(expectedNodeName);
    expect(result.walletInfo.balance).toBe(5.25);
    expect(result.walletInfo.txcount).toBe(42);
  });

  it('should handle zero balance and txcount', async () => {
    bitcoinServiceMock.getWalletInfo.mockResolvedValue({
      balance: 0,
      txcount: 0,
      walletname: 'default',
      walletversion: 169900,
    } as any);

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

    const result = await store.getActions().mcp.getBitcoinWalletInfo({
      networkId: network.id,
    });

    expect(result.success).toBe(true);
    expect(result.walletInfo.balance).toBe(0);
    expect(result.walletInfo.txcount).toBe(0);
  });

  it('should handle large balance and txcount', async () => {
    bitcoinServiceMock.getWalletInfo.mockResolvedValue({
      balance: 1234.56789,
      txcount: 999999,
      walletname: 'default',
      walletversion: 169900,
    } as any);

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

    const result = await store.getActions().mcp.getBitcoinWalletInfo({
      networkId: network.id,
    });

    expect(result.success).toBe(true);
    expect(result.walletInfo.balance).toBe(1234.56789);
    expect(result.walletInfo.txcount).toBe(999999);
  });

  it('should throw error when networkId is missing', async () => {
    await expect(store.getActions().mcp.getBitcoinWalletInfo({} as any)).rejects.toThrow(
      'Network ID is required',
    );
  });

  it('should throw error when network does not exist', async () => {
    await expect(
      store.getActions().mcp.getBitcoinWalletInfo({
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
      btcdNodes: 0,
      tapdNodes: 0,
      litdNodes: 0,
      customNodes: {},
      manualMineCount: 6,
    });

    const network = store.getState().network.networks[0];

    await expect(
      store.getActions().mcp.getBitcoinWalletInfo({
        networkId: network.id,
        nodeName: 'nonexistent-node',
      }),
    ).rejects.toThrow('Bitcoin node "nonexistent-node" not found in network');
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
      store.getActions().mcp.getBitcoinWalletInfo({
        networkId: network.id,
      }),
    ).rejects.toThrow('Network has no Bitcoin nodes');
  });

  it('should throw error when wallet info is not available', async () => {
    // Mock the getWalletInfo to return undefined (no data available)
    bitcoinServiceMock.getWalletInfo.mockResolvedValue(undefined as any);

    await store.getActions().network.addNetwork({
      name: 'test-network',
      description: 'Test',
      lndNodes: 0,
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
    const nodeName = network.nodes.bitcoin[0].name;

    await expect(
      store.getActions().mcp.getBitcoinWalletInfo({
        networkId: network.id,
        nodeName,
      }),
    ).rejects.toThrow('Failed to retrieve bitcoin wallet info');
  });

  it('should handle wallet info with missing balance/txcount fields', async () => {
    bitcoinServiceMock.getWalletInfo.mockResolvedValue({
      walletname: 'default',
      walletversion: 169900,
      // balance and txcount are missing
    } as any);

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

    const result = await store.getActions().mcp.getBitcoinWalletInfo({
      networkId: network.id,
    });

    expect(result.success).toBe(true);
    expect(result.walletInfo.balance).toBe(0); // Should default to 0
    expect(result.walletInfo.txcount).toBe(0); // Should default to 0
  });
});
