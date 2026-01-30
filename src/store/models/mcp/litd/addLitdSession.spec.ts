import { createStore } from 'easy-peasy';
import { Session as LitdSession } from 'lib/litd/types';
import { createMockRootModel, injections, litdServiceMock } from 'utils/tests';

describe('MCP model > addLitdSession', () => {
  const rootModel = createMockRootModel();

  // initialize store for type inference
  let store = createStore(rootModel, { injections });

  beforeEach(() => {
    // reset the store before each test run
    store = createStore(rootModel, { injections });
    jest.clearAllMocks();
    litdServiceMock.listSessions.mockResolvedValue([]);
  });

  it('should add litd session successfully', async () => {
    const mockSession: LitdSession = {
      id: 'new-session-id',
      label: 'New Mobile Wallet',
      pairingPhrase: 'new-pairing-phrase',
      mailboxServerAddr: 'mailbox.example.com:443',
      state: 'Created',
      type: 'Read Only',
      accountId: 'new-account-id',
      localPublicKey:
        '02new1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      remotePublicKey:
        '03new567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12',
      createdAt: Date.now() / 1000,
      expiresAt: Date.now() / 1000 + 86400,
    };

    litdServiceMock.addSession.mockResolvedValue(mockSession);

    // Create a network with 1 litd node
    await store.getActions().network.addNetwork({
      name: 'test-network',
      description: 'Test',
      lndNodes: 0,
      clightningNodes: 0,
      eclairNodes: 0,
      bitcoindNodes: 1,
      btcdNodes: 0,
      tapdNodes: 0,
      litdNodes: 1,
      customNodes: {},
      manualMineCount: 6,
    });

    const network = store.getState().network.networks[0];
    const nodeName = network.nodes.lightning[0].name;

    const futureTimestamp = Math.floor(Date.now() / 1000) + 86400; // 24 hours from now

    const result = await store.getActions().mcp.addLitdSession({
      networkId: network.id,
      nodeName,
      label: 'My Mobile Wallet',
      type: 'read_only',
      expiresAt: futureTimestamp,
    });

    expect(result.success).toBe(true);
    expect(result.message).toContain('Created LNC session "My Mobile Wallet"');
    expect(result.message).toContain(`litd node "${nodeName}"`);
    expect(result.message).toContain('with pairing phrase');
    expect(result.networkId).toBe(network.id);
    expect(result.nodeName).toBe(nodeName);
    expect(result.session).toEqual(mockSession);
    expect(litdServiceMock.addSession).toHaveBeenCalledWith(
      expect.objectContaining({ name: nodeName }),
      'My Mobile Wallet',
      'Read Only',
      futureTimestamp * 1000,
      'mailbox.terminal.lightning.today:443',
    );
  });

  it('should add admin session successfully', async () => {
    const adminSession: LitdSession = {
      id: 'admin-session-id',
      label: 'Admin Access',
      pairingPhrase: 'admin-pairing-phrase',
      mailboxServerAddr: 'mailbox.example.com:443',
      state: 'Created',
      type: 'Admin',
      accountId: 'admin-account-id',
      localPublicKey:
        '02admin1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab',
      remotePublicKey:
        '03admin567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      createdAt: Date.now() / 1000,
      expiresAt: Date.now() / 1000 + 86400,
    };

    litdServiceMock.addSession.mockResolvedValue(adminSession);

    await store.getActions().network.addNetwork({
      name: 'test-network',
      description: 'Test',
      lndNodes: 0,
      clightningNodes: 0,
      eclairNodes: 0,
      bitcoindNodes: 1,
      btcdNodes: 0,
      tapdNodes: 0,
      litdNodes: 1,
      customNodes: {},
      manualMineCount: 6,
    });

    const network = store.getState().network.networks[0];
    const nodeName = network.nodes.lightning[0].name;

    const futureTimestamp = Math.floor(Date.now() / 1000) + 86400;

    const result = await store.getActions().mcp.addLitdSession({
      networkId: network.id,
      nodeName,
      label: 'Admin Access',
      type: 'admin',
      expiresAt: futureTimestamp,
    });

    expect(result.success).toBe(true);
    expect(result.session.type).toBe('Admin');
    expect(litdServiceMock.addSession).toHaveBeenCalledWith(
      expect.anything(),
      'Admin Access',
      'Admin',
      futureTimestamp * 1000,
      'mailbox.terminal.lightning.today:443',
    );
  });

  it('should add session with mailbox server address', async () => {
    await store.getActions().network.addNetwork({
      name: 'test-network',
      description: 'Test',
      lndNodes: 0,
      clightningNodes: 0,
      eclairNodes: 0,
      bitcoindNodes: 1,
      btcdNodes: 0,
      tapdNodes: 0,
      litdNodes: 1,
      customNodes: {},
      manualMineCount: 6,
    });

    const network = store.getState().network.networks[0];
    const nodeName = network.nodes.lightning[0].name;

    const futureTimestamp = Math.floor(Date.now() / 1000) + 86400;
    const mailboxAddr = 'custom.mailbox.com:8443';

    const result = await store.getActions().mcp.addLitdSession({
      networkId: network.id,
      nodeName,
      label: 'Custom Mailbox Session',
      type: 'read_only',
      expiresAt: futureTimestamp,
      mailboxServerAddr: mailboxAddr,
    });

    expect(result.success).toBe(true);
    expect(litdServiceMock.addSession).toHaveBeenCalledWith(
      expect.anything(),
      'Custom Mailbox Session',
      'Read Only',
      futureTimestamp * 1000,
      mailboxAddr,
    );
  });

  it('should throw error when networkId is missing', async () => {
    await expect(
      store.getActions().mcp.addLitdSession({
        nodeName: 'alice',
        label: 'Test Session',
        type: 'read_only',
        expiresAt: Math.floor(Date.now() / 1000) + 86400,
      } as any),
    ).rejects.toThrow('Network ID is required');
  });

  it('should throw error when nodeName is missing', async () => {
    await expect(
      store.getActions().mcp.addLitdSession({
        networkId: 1,
        label: 'Test Session',
        type: 'read_only',
        expiresAt: Math.floor(Date.now() / 1000) + 86400,
      } as any),
    ).rejects.toThrow('Node name is required');
  });

  it('should throw error when label is missing', async () => {
    await expect(
      store.getActions().mcp.addLitdSession({
        networkId: 1,
        nodeName: 'alice',
        type: 'read_only',
        expiresAt: Math.floor(Date.now() / 1000) + 86400,
      } as any),
    ).rejects.toThrow('Session label is required');
  });

  it('should throw error for invalid session type', async () => {
    await store.getActions().network.addNetwork({
      name: 'test-network',
      description: 'Test',
      lndNodes: 0,
      clightningNodes: 0,
      eclairNodes: 0,
      bitcoindNodes: 1,
      btcdNodes: 0,
      tapdNodes: 0,
      litdNodes: 1,
      customNodes: {},
      manualMineCount: 6,
    });

    const network = store.getState().network.networks[0];
    const nodeName = network.nodes.lightning[0].name;

    const futureTimestamp = Math.floor(Date.now() / 1000) + 86400;

    await expect(
      store.getActions().mcp.addLitdSession({
        networkId: network.id,
        nodeName,
        label: 'Test Session',
        type: 'invalid_type' as any,
        expiresAt: futureTimestamp,
      }),
    ).rejects.toThrow('Session type must be admin or read_only');
  });

  it('should throw error when expiresAt is in the past', async () => {
    const pastTimestamp = Math.floor(Date.now() / 1000) - 86400; // 24 hours ago

    await expect(
      store.getActions().mcp.addLitdSession({
        networkId: 1,
        nodeName: 'alice',
        label: 'Test Session',
        type: 'read_only',
        expiresAt: pastTimestamp,
      }),
    ).rejects.toThrow('Session expiration must be a future timestamp');
  });

  it('should use default expiration when expiresAt is null', async () => {
    const nullSession: LitdSession = {
      id: 'null-session-id',
      label: 'Null Expiry Session',
      pairingPhrase: 'null-pairing-phrase',
      mailboxServerAddr: 'mailbox.example.com:443',
      state: 'Created',
      type: 'Read Only',
      accountId: 'null-account-id',
      localPublicKey:
        '02null1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab',
      remotePublicKey:
        '03null567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      createdAt: Date.now() / 1000,
      expiresAt: Date.now() / 1000 + 7776000, // 90 days from now
    };

    litdServiceMock.addSession.mockResolvedValue(nullSession);

    await store.getActions().network.addNetwork({
      name: 'test-network',
      description: 'Test',
      lndNodes: 0,
      clightningNodes: 0,
      eclairNodes: 0,
      bitcoindNodes: 1,
      btcdNodes: 0,
      tapdNodes: 0,
      litdNodes: 1,
      customNodes: {},
      manualMineCount: 6,
    });

    const network = store.getState().network.networks[0];
    const nodeName = network.nodes.lightning[0].name;

    const result = await store.getActions().mcp.addLitdSession({
      networkId: network.id,
      nodeName,
      label: 'Null Expiry Session',
      type: 'read_only',
      expiresAt: null as any,
    });

    expect(result.success).toBe(true);
    expect(litdServiceMock.addSession).toHaveBeenCalledWith(
      expect.anything(),
      'Null Expiry Session',
      'Read Only',
      expect.any(Number), // Should be 90 days from now
      'mailbox.terminal.lightning.today:443',
    );
  });

  it('should use default expiration when expiresAt is not provided', async () => {
    const defaultSession: LitdSession = {
      id: 'default-session-id',
      label: 'Default Expiry Session',
      pairingPhrase: 'default-pairing-phrase',
      mailboxServerAddr: 'mailbox.example.com:443',
      state: 'Created',
      type: 'Admin',
      accountId: 'default-account-id',
      localPublicKey:
        '02default1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab',
      remotePublicKey:
        '03default567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      createdAt: Date.now() / 1000,
      expiresAt: Date.now() / 1000 + 7776000, // 90 days from now
    };

    litdServiceMock.addSession.mockResolvedValue(defaultSession);

    await store.getActions().network.addNetwork({
      name: 'test-network',
      description: 'Test',
      lndNodes: 0,
      clightningNodes: 0,
      eclairNodes: 0,
      bitcoindNodes: 1,
      btcdNodes: 0,
      tapdNodes: 0,
      litdNodes: 1,
      customNodes: {},
      manualMineCount: 6,
    });

    const network = store.getState().network.networks[0];
    const nodeName = network.nodes.lightning[0].name;

    const result = await store.getActions().mcp.addLitdSession({
      networkId: network.id,
      nodeName,
      label: 'Default Expiry Session',
      type: 'admin',
      // expiresAt not provided - should use default
    });

    expect(result.success).toBe(true);
    expect(litdServiceMock.addSession).toHaveBeenCalledWith(
      expect.anything(),
      'Default Expiry Session',
      'Admin',
      expect.any(Number), // Should be 90 days from now
      'mailbox.terminal.lightning.today:443',
    );
  });

  it('should throw error when network does not exist', async () => {
    await expect(
      store.getActions().mcp.addLitdSession({
        networkId: 9999,
        nodeName: 'alice',
        label: 'Test Session',
        type: 'read_only',
        expiresAt: Math.floor(Date.now() / 1000) + 86400,
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
      btcdNodes: 0,
      tapdNodes: 0,
      litdNodes: 0,
      customNodes: {},
      manualMineCount: 6,
    });

    const network = store.getState().network.networks[0];

    await expect(
      store.getActions().mcp.addLitdSession({
        networkId: network.id,
        nodeName: 'nonexistent-node',
        label: 'Test Session',
        type: 'read_only',
        expiresAt: Math.floor(Date.now() / 1000) + 86400,
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
      btcdNodes: 0,
      tapdNodes: 0,
      litdNodes: 0,
      customNodes: {},
      manualMineCount: 6,
    });

    const network = store.getState().network.networks[0];
    const nodeName = network.nodes.lightning[0].name;

    await expect(
      store.getActions().mcp.addLitdSession({
        networkId: network.id,
        nodeName,
        label: 'Test Session',
        type: 'read_only',
        expiresAt: Math.floor(Date.now() / 1000) + 86400,
      }),
    ).rejects.toThrow(`Node "${nodeName}" is not a litd node`);
  });

  it('should handle long session labels', async () => {
    await store.getActions().network.addNetwork({
      name: 'test-network',
      description: 'Test',
      lndNodes: 0,
      clightningNodes: 0,
      eclairNodes: 0,
      bitcoindNodes: 1,
      btcdNodes: 0,
      tapdNodes: 0,
      litdNodes: 1,
      customNodes: {},
      manualMineCount: 6,
    });

    const network = store.getState().network.networks[0];
    const nodeName = network.nodes.lightning[0].name;

    const longLabel =
      'This is a very long session label that should still work correctly and not cause any issues with the session creation process';

    const result = await store.getActions().mcp.addLitdSession({
      networkId: network.id,
      nodeName,
      label: longLabel,
      type: 'admin',
      expiresAt: Math.floor(Date.now() / 1000) + 86400,
    });

    expect(result.success).toBe(true);
    expect(result.message).toContain(`Created LNC session "${longLabel}"`);
    expect(litdServiceMock.addSession).toHaveBeenCalledWith(
      expect.anything(),
      longLabel,
      'Admin',
      expect.any(Number),
      'mailbox.terminal.lightning.today:443',
    );
  });

  it('should handle short expiration times', async () => {
    await store.getActions().network.addNetwork({
      name: 'test-network',
      description: 'Test',
      lndNodes: 0,
      clightningNodes: 0,
      eclairNodes: 0,
      bitcoindNodes: 1,
      btcdNodes: 0,
      tapdNodes: 0,
      litdNodes: 1,
      customNodes: {},
      manualMineCount: 6,
    });

    const network = store.getState().network.networks[0];
    const nodeName = network.nodes.lightning[0].name;

    // Short expiration time (1 hour)
    const shortExpiration = Math.floor(Date.now() / 1000) + 3600;

    const result = await store.getActions().mcp.addLitdSession({
      networkId: network.id,
      nodeName,
      label: 'Short Session',
      type: 'read_only',
      expiresAt: shortExpiration,
    });

    expect(result.success).toBe(true);
    expect(litdServiceMock.addSession).toHaveBeenCalledWith(
      expect.anything(),
      'Short Session',
      'Read Only',
      shortExpiration * 1000,
      'mailbox.terminal.lightning.today:443',
    );
  });
});
