import { createStore } from 'easy-peasy';
import { createMockRootModel, injections, litdServiceMock } from 'utils/tests';

describe('MCP model > revokeLitdSession', () => {
  const rootModel = createMockRootModel();

  // initialize store for type inference
  let store = createStore(rootModel, { injections });

  beforeEach(() => {
    // reset the store before each test run
    store = createStore(rootModel, { injections });
    jest.clearAllMocks();
    litdServiceMock.revokeSession.mockResolvedValue();
    litdServiceMock.listSessions.mockResolvedValue([]);
  });

  it('should revoke litd session successfully', async () => {
    // Create a network with 1 litd node
    await store.getActions().network.addNetwork({
      name: 'test-network',
      description: 'Test',
      lndNodes: 0,
      clightningNodes: 0,
      eclairNodes: 0,
      bitcoindNodes: 1,
      tapdNodes: 0,
      litdNodes: 1,
      customNodes: {},
      manualMineCount: 6,
    });

    const network = store.getState().network.networks[0];
    const nodeName = network.nodes.lightning[0].name;

    const publicKey =
      '02abcd1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab';

    const result = await store.getActions().mcp.revokeLitdSession({
      networkId: network.id,
      nodeName,
      localPublicKey: publicKey,
    });

    expect(result.success).toBe(true);
    expect(result.message).toContain('Revoked LNC session');
    expect(result.message).toContain(`"${publicKey.slice(0, 12)}..."`);
    expect(result.message).toContain(`litd node "${nodeName}"`);
    expect(result.networkId).toBe(network.id);
    expect(result.nodeName).toBe(nodeName);
    expect(litdServiceMock.revokeSession).toHaveBeenCalledWith(
      expect.objectContaining({ name: nodeName }),
      publicKey,
    );
  });

  it('should throw error when networkId is missing', async () => {
    await expect(
      store.getActions().mcp.revokeLitdSession({
        nodeName: 'alice',
        localPublicKey:
          '02abcd1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab',
      } as any),
    ).rejects.toThrow('Network ID is required');
  });

  it('should throw error when nodeName is missing', async () => {
    await expect(
      store.getActions().mcp.revokeLitdSession({
        networkId: 1,
        localPublicKey:
          '02abcd1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab',
      } as any),
    ).rejects.toThrow('Node name is required');
  });

  it('should throw error when localPublicKey is missing', async () => {
    await expect(
      store.getActions().mcp.revokeLitdSession({
        networkId: 1,
        nodeName: 'alice',
      } as any),
    ).rejects.toThrow('Local public key is required');
  });

  it('should throw error when network does not exist', async () => {
    await expect(
      store.getActions().mcp.revokeLitdSession({
        networkId: 9999,
        nodeName: 'alice',
        localPublicKey:
          '02abcd1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab',
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
      store.getActions().mcp.revokeLitdSession({
        networkId: network.id,
        nodeName: 'nonexistent-node',
        localPublicKey:
          '02abcd1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab',
      }),
    ).rejects.toThrow('Lightning node "nonexistent-node" not found in network');
  });

  it('should throw error when node is not a litd node', async () => {
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
    const nodeName = network.nodes.lightning[0].name;

    await expect(
      store.getActions().mcp.revokeLitdSession({
        networkId: network.id,
        nodeName,
        localPublicKey:
          '02abcd1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab',
      }),
    ).rejects.toThrow(`Node "${nodeName}" is not a litd node`);
  });

  it('should handle long public keys', async () => {
    await store.getActions().network.addNetwork({
      name: 'test-network',
      description: 'Test',
      lndNodes: 0,
      clightningNodes: 0,
      eclairNodes: 0,
      bitcoindNodes: 1,
      tapdNodes: 0,
      litdNodes: 1,
      customNodes: {},
      manualMineCount: 6,
    });

    const network = store.getState().network.networks[0];
    const nodeName = network.nodes.lightning[0].name;

    const longPublicKey =
      '02abcd1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab';

    const result = await store.getActions().mcp.revokeLitdSession({
      networkId: network.id,
      nodeName,
      localPublicKey: longPublicKey,
    });

    expect(result.success).toBe(true);
    expect(result.message).toContain('02abcd123456...');
    expect(litdServiceMock.revokeSession).toHaveBeenCalledWith(
      expect.anything(),
      longPublicKey,
    );
  });

  it('should handle short public keys', async () => {
    await store.getActions().network.addNetwork({
      name: 'test-network',
      description: 'Test',
      lndNodes: 0,
      clightningNodes: 0,
      eclairNodes: 0,
      bitcoindNodes: 1,
      tapdNodes: 0,
      litdNodes: 1,
      customNodes: {},
      manualMineCount: 6,
    });

    const network = store.getState().network.networks[0];
    const nodeName = network.nodes.lightning[0].name;

    const shortPublicKey = '02abcd';

    const result = await store.getActions().mcp.revokeLitdSession({
      networkId: network.id,
      nodeName,
      localPublicKey: shortPublicKey,
    });

    expect(result.success).toBe(true);
    expect(result.message).toContain('02abcd...');
    expect(litdServiceMock.revokeSession).toHaveBeenCalledWith(
      expect.anything(),
      shortPublicKey,
    );
  });

  it('should handle public keys with different prefixes', async () => {
    await store.getActions().network.addNetwork({
      name: 'test-network',
      description: 'Test',
      lndNodes: 0,
      clightningNodes: 0,
      eclairNodes: 0,
      bitcoindNodes: 1,
      tapdNodes: 0,
      litdNodes: 1,
      customNodes: {},
      manualMineCount: 6,
    });

    const network = store.getState().network.networks[0];
    const nodeName = network.nodes.lightning[0].name;

    const publicKeyWith03 =
      '03cdef234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';

    const result = await store.getActions().mcp.revokeLitdSession({
      networkId: network.id,
      nodeName,
      localPublicKey: publicKeyWith03,
    });

    expect(result.success).toBe(true);
    expect(result.message).toContain('03cdef234567...');
    expect(litdServiceMock.revokeSession).toHaveBeenCalledWith(
      expect.anything(),
      publicKeyWith03,
    );
  });

  it('should handle multiple revocation calls', async () => {
    await store.getActions().network.addNetwork({
      name: 'test-network',
      description: 'Test',
      lndNodes: 0,
      clightningNodes: 0,
      eclairNodes: 0,
      bitcoindNodes: 1,
      tapdNodes: 0,
      litdNodes: 1,
      customNodes: {},
      manualMineCount: 6,
    });

    const network = store.getState().network.networks[0];
    const nodeName = network.nodes.lightning[0].name;

    const publicKey1 =
      '02abcd1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab';
    const publicKey2 =
      '03cdef234567890abcdef1234567890abcdef1234567890abcdef1234567890ab';

    // First revocation
    await store.getActions().mcp.revokeLitdSession({
      networkId: network.id,
      nodeName,
      localPublicKey: publicKey1,
    });

    // Second revocation
    await store.getActions().mcp.revokeLitdSession({
      networkId: network.id,
      nodeName,
      localPublicKey: publicKey2,
    });

    expect(litdServiceMock.revokeSession).toHaveBeenCalledTimes(2);
    expect(litdServiceMock.revokeSession).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ name: nodeName }),
      publicKey1,
    );
    expect(litdServiceMock.revokeSession).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ name: nodeName }),
      publicKey2,
    );
  });

  it('should handle revocation errors from service', async () => {
    litdServiceMock.revokeSession.mockRejectedValue(new Error('Session not found'));

    await store.getActions().network.addNetwork({
      name: 'test-network',
      description: 'Test',
      lndNodes: 0,
      clightningNodes: 0,
      eclairNodes: 0,
      bitcoindNodes: 1,
      tapdNodes: 0,
      litdNodes: 1,
      customNodes: {},
      manualMineCount: 6,
    });

    const network = store.getState().network.networks[0];
    const nodeName = network.nodes.lightning[0].name;

    const publicKey =
      '02abcd1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab';

    await expect(
      store.getActions().mcp.revokeLitdSession({
        networkId: network.id,
        nodeName,
        localPublicKey: publicKey,
      }),
    ).rejects.toThrow('Session not found');
  });
});
