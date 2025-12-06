import { createStore } from 'easy-peasy';
import { createMockRootModel, injections } from 'utils/tests';

describe('MCP model > sendBitcoin', () => {
  const rootModel = createMockRootModel();

  // initialize store for type inference
  let store = createStore(rootModel, { injections });

  beforeEach(() => {
    // reset the store before each test run
    store = createStore(rootModel, { injections });
    jest.clearAllMocks();
  });

  it('should send Bitcoin from a Bitcoin node successfully', async () => {
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
    const mockTxid = 'abc123def456';
    const bitcoinActions = store.getActions().bitcoin;
    jest.spyOn(bitcoinActions, 'sendFunds').mockResolvedValue(mockTxid);

    const result = await store.getActions().mcp.sendBitcoin({
      networkId: network.id,
      fromNode: 'backend1',
      toAddress: 'bcrt1qexampleaddress',
      amount: 1000000,
      autoMine: true,
    });

    expect(result.success).toBe(true);
    expect(result.message).toContain(
      'Sent 1000000 bitcoin from "backend1" to bcrt1qexampleaddress',
    );
    expect(result.message).toContain('auto-mined 6 blocks');
    expect(result.networkId).toBe(network.id);
    expect(result.fromNode).toBe('backend1');
    expect(result.toAddress).toBe('bcrt1qexampleaddress');
    expect(result.amount).toBe(1000000);
    expect(result.txid).toBe(mockTxid);
    expect(result.autoMined).toBe(true);

    expect(bitcoinActions.sendFunds).toHaveBeenCalledWith({
      node: network.nodes.bitcoin[0],
      toAddress: 'bcrt1qexampleaddress',
      amount: 1000000,
      autoMine: true,
    });
  });

  it('should send Bitcoin without autoMine when not specified', async () => {
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
    const mockTxid = 'xyz987uvw654';
    const bitcoinActions = store.getActions().bitcoin;
    jest.spyOn(bitcoinActions, 'sendFunds').mockResolvedValue(mockTxid);

    const result = await store.getActions().mcp.sendBitcoin({
      networkId: network.id,
      fromNode: 'backend1',
      toAddress: 'bcrt1qexampleaddress',
      amount: 250000,
    });

    expect(result.success).toBe(true);
    expect(result.message).not.toContain('auto-mined');
    expect(result.autoMined).toBeUndefined();

    expect(bitcoinActions.sendFunds).toHaveBeenCalledWith({
      node: network.nodes.bitcoin[0],
      toAddress: 'bcrt1qexampleaddress',
      amount: 250000,
      autoMine: false,
    });
  });

  it('should throw error when networkId is missing', async () => {
    await expect(
      store.getActions().mcp.sendBitcoin({
        fromNode: 'alice',
        toAddress: 'bcrt1qexampleaddress',
        amount: 100000,
      } as any),
    ).rejects.toThrow('Network ID is required');
  });

  it('should throw error when fromNode is missing', async () => {
    await expect(
      store.getActions().mcp.sendBitcoin({
        networkId: 1,
        toAddress: 'bcrt1qexampleaddress',
        amount: 100000,
      } as any),
    ).rejects.toThrow('From node name is required');
  });

  it('should throw error when toAddress is missing', async () => {
    await expect(
      store.getActions().mcp.sendBitcoin({
        networkId: 1,
        fromNode: 'alice',
        amount: 100000,
      } as any),
    ).rejects.toThrow('To address is required');
  });

  it('should throw error when amount is missing', async () => {
    await expect(
      store.getActions().mcp.sendBitcoin({
        networkId: 1,
        fromNode: 'alice',
        toAddress: 'bcrt1qexampleaddress',
      } as any),
    ).rejects.toThrow('Amount must be greater than 0');
  });

  it('should throw error when amount is zero', async () => {
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
      store.getActions().mcp.sendBitcoin({
        networkId: network.id,
        fromNode: 'alice',
        toAddress: 'bcrt1qexampleaddress',
        amount: 0,
      }),
    ).rejects.toThrow('Amount must be greater than 0');
  });

  it('should throw error when amount is negative', async () => {
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
      store.getActions().mcp.sendBitcoin({
        networkId: network.id,
        fromNode: 'alice',
        toAddress: 'bcrt1qexampleaddress',
        amount: -1000,
      }),
    ).rejects.toThrow('Amount must be greater than 0');
  });

  it('should throw error when network does not exist', async () => {
    await expect(
      store.getActions().mcp.sendBitcoin({
        networkId: 9999,
        fromNode: 'alice',
        toAddress: 'bcrt1qexampleaddress',
        amount: 100000,
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
      store.getActions().mcp.sendBitcoin({
        networkId: network.id,
        fromNode: 'nonexistent-node',
        toAddress: 'bcrt1qexampleaddress',
        amount: 100000,
      }),
    ).rejects.toThrow('Bitcoin node "nonexistent-node" not found in network');
  });

  it('should throw error when specified Bitcoin node does not exist', async () => {
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

    await expect(
      store.getActions().mcp.sendBitcoin({
        networkId: network.id,
        fromNode: 'nonexistent-bitcoin-node',
        toAddress: 'bcrt1qexampleaddress',
        amount: 100000,
      }),
    ).rejects.toThrow('Bitcoin node "nonexistent-bitcoin-node" not found in network');
  });
});
