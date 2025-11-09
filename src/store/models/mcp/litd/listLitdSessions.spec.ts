import { createStore } from 'easy-peasy';
import { Session as LitdSession } from 'lib/litd/types';
import { createMockRootModel, injections, litdServiceMock } from 'utils/tests';

describe('MCP model > listLitdSessions', () => {
  const rootModel = createMockRootModel();

  // initialize store for type inference
  let store = createStore(rootModel, { injections });

  const mockSessions: LitdSession[] = [
    {
      id: 'session-1',
      label: 'My Mobile Wallet',
      pairingPhrase: 'pairing-phrase-1',
      mailboxServerAddr: 'mailbox.example.com:443',
      state: 'In Use',
      type: 'Read Only',
      accountId: 'account-1',
      localPublicKey:
        '02abcd1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab',
      remotePublicKey:
        '03efgh567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12',
      createdAt: 1640995200, // Jan 1, 2022
      expiresAt: 1672531200, // Jan 1, 2023
    },
    {
      id: 'session-2',
      label: 'Admin Session',
      pairingPhrase: 'pairing-phrase-2',
      mailboxServerAddr: 'mailbox.example.com:443',
      state: 'Created',
      type: 'Admin',
      accountId: 'account-2',
      localPublicKey:
        '02cdef234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      remotePublicKey:
        '03fghi67890abcdef1234567890abcdef1234567890abcdef1234567890abcdef123',
      createdAt: 1641081600, // Jan 2, 2022
      expiresAt: 1672617600, // Jan 2, 2023
    },
  ];

  beforeEach(() => {
    // reset the store before each test run
    store = createStore(rootModel, { injections });
    jest.clearAllMocks();
    litdServiceMock.listSessions.mockResolvedValue(mockSessions);
  });

  it('should list litd sessions successfully', async () => {
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

    const result = await store.getActions().mcp.listLitdSessions({
      networkId: network.id,
      nodeName,
    });

    expect(result.success).toBe(true);
    expect(result.message).toContain('Found 2 session(s)');
    expect(result.message).toContain(`litd node "${nodeName}"`);
    expect(result.networkId).toBe(network.id);
    expect(result.nodeName).toBe(nodeName);
    expect(result.sessions).toHaveLength(2);
    expect(result.sessions[0]).toEqual(mockSessions[0]);
    expect(result.sessions[1]).toEqual(mockSessions[1]);
    expect(litdServiceMock.listSessions).toHaveBeenCalledWith(
      expect.objectContaining({ name: nodeName }),
    );
  });

  it('should handle empty sessions list', async () => {
    litdServiceMock.listSessions.mockResolvedValue([]);

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

    const result = await store.getActions().mcp.listLitdSessions({
      networkId: network.id,
      nodeName,
    });

    expect(result.success).toBe(true);
    expect(result.message).toContain('Found 0 session(s)');
    expect(result.sessions).toHaveLength(0);
  });

  it('should handle case where node state has no sessions property', async () => {
    // Mock listSessions but don't set up the lit state properly
    litdServiceMock.listSessions.mockResolvedValue(mockSessions);

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

    // Manually set up lit state without sessions to test the fallback
    store.getState().lit.nodes[nodeName] = {};

    const result = await store.getActions().mcp.listLitdSessions({
      networkId: network.id,
      nodeName,
    });

    expect(result.success).toBe(true);
    expect(result.sessions).toHaveLength(2); // Should still work due to the fallback
  });

  it('should handle case where node does not exist in lit state', async () => {
    // Mock listSessions
    litdServiceMock.listSessions.mockResolvedValue([]);

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

    // Remove the node from lit state to test the optional chaining
    delete store.getState().lit.nodes[nodeName];

    const result = await store.getActions().mcp.listLitdSessions({
      networkId: network.id,
      nodeName,
    });

    expect(result.success).toBe(true);
    expect(result.sessions).toHaveLength(0); // Should return empty array due to fallback
  });

  it('should throw error when networkId is missing', async () => {
    await expect(
      store.getActions().mcp.listLitdSessions({
        nodeName: 'alice',
      } as any),
    ).rejects.toThrow('Network ID is required');
  });

  it('should throw error when nodeName is missing', async () => {
    await expect(
      store.getActions().mcp.listLitdSessions({
        networkId: 1,
      } as any),
    ).rejects.toThrow('Node name is required');
  });

  it('should throw error when network does not exist', async () => {
    await expect(
      store.getActions().mcp.listLitdSessions({
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
      tapdNodes: 0,
      litdNodes: 0,
      customNodes: {},
      manualMineCount: 6,
    });

    const network = store.getState().network.networks[0];

    await expect(
      store.getActions().mcp.listLitdSessions({
        networkId: network.id,
        nodeName: 'nonexistent-node',
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
      store.getActions().mcp.listLitdSessions({
        networkId: network.id,
        nodeName,
      }),
    ).rejects.toThrow(`Node "${nodeName}" is not a litd node`);
  });

  it('should handle different session states', async () => {
    const sessionsWithDifferentStates: LitdSession[] = [
      {
        ...mockSessions[0],
        state: 'Created' as const,
      },
      {
        ...mockSessions[1],
        state: 'Revoked' as const,
      },
    ];
    litdServiceMock.listSessions.mockResolvedValue(sessionsWithDifferentStates);

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

    const result = await store.getActions().mcp.listLitdSessions({
      networkId: network.id,
      nodeName,
    });

    expect(result.success).toBe(true);
    expect(result.sessions).toHaveLength(2);
    expect(result.sessions[0].state).toBe('Created');
    expect(result.sessions[1].state).toBe('Revoked');
  });

  it('should handle different session types', async () => {
    const sessionsWithDifferentTypes: LitdSession[] = [
      {
        ...mockSessions[0],
        type: 'Admin' as const,
      },
      {
        ...mockSessions[1],
        type: 'Custom' as const,
      },
    ];
    litdServiceMock.listSessions.mockResolvedValue(sessionsWithDifferentTypes);

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

    const result = await store.getActions().mcp.listLitdSessions({
      networkId: network.id,
      nodeName,
    });

    expect(result.success).toBe(true);
    expect(result.sessions).toHaveLength(2);
    expect(result.sessions[0].type).toBe('Admin');
    expect(result.sessions[1].type).toBe('Custom');
  });

  it('should handle expired sessions', async () => {
    const expiredSession: LitdSession = {
      ...mockSessions[0],
      expiresAt: 1609459200, // Jan 1, 2021 (expired)
    };
    litdServiceMock.listSessions.mockResolvedValue([expiredSession]);

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

    const result = await store.getActions().mcp.listLitdSessions({
      networkId: network.id,
      nodeName,
    });

    expect(result.success).toBe(true);
    expect(result.sessions).toHaveLength(1);
    expect(result.sessions[0].expiresAt).toBe(1609459200);
  });
});
