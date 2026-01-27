import { createStore } from 'easy-peasy';
import { NodeImplementation } from 'shared/types';
import { getDefaultCommand } from 'utils/network';
import { createMockRootModel, injections } from 'utils/tests';

describe('MCP model > getDefaultNodeCommand', () => {
  const rootModel = createMockRootModel();

  // initialize store for type inference
  let store = createStore(rootModel, { injections });

  beforeEach(() => {
    // reset the store before each test run
    store = createStore(rootModel, { injections });
    jest.clearAllMocks();
  });

  it('should get default command for LND', async () => {
    const result = await store.getActions().mcp.getDefaultNodeCommand({
      implementation: 'LND',
    });

    expect(result.success).toBe(true);
    expect(result.implementation).toBe('LND');
    expect(result.version).toBeDefined();
    expect(result.command).toBeDefined();
    expect(result.command).toContain('lnd');
    expect(result.command).toContain('--alias={{name}}');
    expect(result.message).toContain('Retrieved default command for LND');
  });

  it('should get default command for c-lightning', async () => {
    const result = await store.getActions().mcp.getDefaultNodeCommand({
      implementation: 'c-lightning',
    });

    expect(result.success).toBe(true);
    expect(result.implementation).toBe('c-lightning');
    expect(result.version).toBeDefined();
    expect(result.command).toBeDefined();
    expect(result.command).toContain('lightningd');
    expect(result.command).toContain('--alias={{name}}');
    expect(result.message).toContain('Retrieved default command for c-lightning');
  });

  it('should get default command for bitcoind', async () => {
    const result = await store.getActions().mcp.getDefaultNodeCommand({
      implementation: 'bitcoind',
    });

    expect(result.success).toBe(true);
    expect(result.implementation).toBe('bitcoind');
    expect(result.version).toBeDefined();
    expect(result.command).toBeDefined();
    expect(result.command).toContain('bitcoind');
    expect(result.message).toContain('Retrieved default command for bitcoind');
  });

  it('should get default command for tapd', async () => {
    const result = await store.getActions().mcp.getDefaultNodeCommand({
      implementation: 'tapd',
    });

    expect(result.success).toBe(true);
    expect(result.implementation).toBe('tapd');
    expect(result.version).toBeDefined();
    expect(result.command).toBeDefined();
    expect(result.command).toContain('tapd');
    expect(result.message).toContain('Retrieved default command for tapd');
  });

  it('should get default command for eclair', async () => {
    const result = await store.getActions().mcp.getDefaultNodeCommand({
      implementation: 'eclair',
    });

    expect(result.success).toBe(true);
    expect(result.implementation).toBe('eclair');
    expect(result.version).toBeDefined();
    expect(result.command).toBeDefined();
    expect(result.command).toContain('eclair');
    expect(result.message).toContain('Retrieved default command for eclair');
  });

  it('should get default command for litd', async () => {
    const result = await store.getActions().mcp.getDefaultNodeCommand({
      implementation: 'litd',
    });

    expect(result.success).toBe(true);
    expect(result.implementation).toBe('litd');
    expect(result.version).toBeDefined();
    expect(result.command).toBeDefined();
    expect(result.command).toContain('litd');
    expect(result.message).toContain('Retrieved default command for litd');
  });

  it('should get default command with specific version', async () => {
    const specificVersion = '0.17.0-beta';

    const result = await store.getActions().mcp.getDefaultNodeCommand({
      implementation: 'LND',
      version: specificVersion,
    });

    expect(result.success).toBe(true);
    expect(result.implementation).toBe('LND');
    expect(result.version).toBe(specificVersion);
    expect(result.command).toBeDefined();
    expect(result.message).toContain(
      `Retrieved default command for LND v${specificVersion}`,
    );
  });

  it('should handle version-specific command modifications for tapd', async () => {
    // Test with a version that should trigger the old command format
    const oldVersion = '0.3.0-alpha';

    const result = await store.getActions().mcp.getDefaultNodeCommand({
      implementation: 'tapd',
      version: oldVersion,
    });

    expect(result.success).toBe(true);
    expect(result.implementation).toBe('tapd');
    expect(result.version).toBe(oldVersion);
    expect(result.command).toBeDefined();
    // For older versions, the command should not contain the newer flags
    expect(result.command).not.toContain('--universe.public-access=rw');
  });

  it('should handle version-specific command modifications for c-lightning', async () => {
    // Test with a version that should trigger the old command format
    const oldVersion = '24.08';

    const result = await store.getActions().mcp.getDefaultNodeCommand({
      implementation: 'c-lightning',
      version: oldVersion,
    });

    expect(result.success).toBe(true);
    expect(result.implementation).toBe('c-lightning');
    expect(result.version).toBe(oldVersion);
    expect(result.command).toBeDefined();
    // For older versions, the command should not contain grpc-host
    expect(result.command).not.toContain('--grpc-host=0.0.0.0');
  });

  it('should throw error when implementation is missing', async () => {
    await expect(store.getActions().mcp.getDefaultNodeCommand({} as any)).rejects.toThrow(
      'Implementation is required',
    );
  });

  it('should throw error when implementation is empty string', async () => {
    await expect(
      store.getActions().mcp.getDefaultNodeCommand({
        implementation: '' as any,
      }),
    ).rejects.toThrow('Implementation is required');
  });

  it.each([
    'LND' as NodeImplementation,
    'c-lightning' as NodeImplementation,
    'eclair' as NodeImplementation,
    'bitcoind' as NodeImplementation,
    'tapd' as NodeImplementation,
    'litd' as NodeImplementation,
  ])('should return same command as getDefaultCommand utility for %s', async impl => {
    const result = await store.getActions().mcp.getDefaultNodeCommand({
      implementation: impl,
    });

    const expectedCommand = getDefaultCommand(impl, result.version);
    expect(result.command).toBe(expectedCommand);
  });
});
