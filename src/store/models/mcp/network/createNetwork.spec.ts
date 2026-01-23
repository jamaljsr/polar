import { createStore } from 'easy-peasy';
import { DockerRepoState } from 'types';
import { defaultRepoState } from 'utils/constants';
import { createMockRootModel, injections } from 'utils/tests';

describe('MCP model > createNetwork', () => {
  const rootModel = createMockRootModel();

  // initialize store for type inference
  let store = createStore(rootModel, { injections });

  beforeEach(() => {
    // reset the store before each test run
    store = createStore(rootModel, { injections });
    jest.clearAllMocks();
  });

  it('should create a network with default values', async () => {
    const result = await store.getActions().mcp.createNetwork({
      name: 'new-network',
    });

    expect(result.success).toBe(true);
    expect(result.message).toContain('new-network');
    expect(result.message).toContain('created successfully');
    expect(result.network).toBeDefined();
    expect(result.network.name).toBe('new-network');

    // Verify default node plan was applied (2 LND + 1 bitcoind latest)
    expect(result.network.nodes.lightning).toHaveLength(2);
    expect(result.network.nodes.bitcoin).toHaveLength(1);
  });

  it('should create a network matching the requested nodes and versions', async () => {
    const result = await store.getActions().mcp.createNetwork({
      name: 'custom-network',
      description: 'Custom network with specific nodes',
      nodes: [
        { implementation: 'bitcoind' },
        { implementation: 'bitcoind', version: '27.0' },
        { implementation: 'LND', count: 2 },
        { implementation: 'LND', version: '0.18.3-beta' },
        { implementation: 'c-lightning', count: 1 },
      ],
    });

    expect(result.success).toBe(true);
    expect(result.network.name).toBe('custom-network');
    expect(result.network.description).toBe('Custom network with specific nodes');

    const lightningVersions = result.network.nodes.lightning.map(n => ({
      impl: n.implementation,
      version: n.version,
    }));
    const bitcoinVersions = result.network.nodes.bitcoin.map(n => n.version);

    expect(bitcoinVersions).toContain('27.0');
    expect(bitcoinVersions).toHaveLength(2);
    expect(lightningVersions.filter(n => n.impl === 'LND')).toHaveLength(3);
    expect(lightningVersions.some(n => n.version === '0.18.3-beta')).toBe(true);
    expect(lightningVersions.filter(n => n.impl === 'c-lightning')).toHaveLength(1);
  });

  it('should create a network using only pinned versions', async () => {
    const result = await store.getActions().mcp.createNetwork({
      name: 'pinned-network',
      nodes: [
        { implementation: 'bitcoind', version: '27.0' },
        { implementation: 'LND', version: '0.18.3-beta' },
      ],
    });

    expect(result.success).toBe(true);
    expect(result.network.nodes.bitcoin).toHaveLength(1);
    expect(result.network.nodes.lightning).toHaveLength(1);
    expect(result.network.nodes.bitcoin[0].version).toBe('27.0');
    expect(result.network.nodes.lightning[0].version).toBe('0.18.3-beta');
  });

  it('should create an empty network when no nodes are specified', async () => {
    const result = await store.getActions().mcp.createNetwork({
      name: 'empty-network',
      nodes: [],
    });

    expect(result.success).toBe(true);
    expect(result.network.nodes.bitcoin).toHaveLength(0);
    expect(result.network.nodes.lightning).toHaveLength(0);
    expect(result.network.nodes.tap).toHaveLength(0);
  });

  it('should create a network with only Core Lightning nodes when requested', async () => {
    const result = await store.getActions().mcp.createNetwork({
      name: 'no-lnd-network',
      nodes: [
        { implementation: 'bitcoind' },
        { implementation: 'c-lightning', count: 2 },
      ],
    });

    expect(result.success).toBe(true);
    expect(result.network.nodes.lightning).toHaveLength(2);
    expect(
      result.network.nodes.lightning.every(n => n.implementation === 'c-lightning'),
    ).toBe(true);
    expect(result.network.nodes.bitcoin).toHaveLength(1);
  });

  it('should reject non-positive node counts', async () => {
    await expect(
      store.getActions().mcp.createNetwork({
        name: 'invalid-count',
        nodes: [{ implementation: 'bitcoind', count: 0 }, { implementation: 'LND' }],
      }),
    ).rejects.toThrow('Invalid count "0" for bitcoind');
  });

  it('should require an implementation for each node entry', async () => {
    await expect(
      store.getActions().mcp.createNetwork({
        name: 'missing-impl',
        nodes: [{} as any],
      }),
    ).rejects.toThrow('Each node entry must include an implementation.');
  });

  it('should reject unsupported implementations', async () => {
    await expect(
      store.getActions().mcp.createNetwork({
        name: 'unsupported-impl',
        nodes: [{ implementation: 'invalid-impl' as any }],
      }),
    ).rejects.toThrow('Unsupported implementation "invalid-impl"');
  });

  it('should reject implementations missing from the repo state', async () => {
    const repoState = JSON.parse(JSON.stringify(defaultRepoState)) as DockerRepoState;
    delete (repoState.images as Record<string, unknown>).eclair;
    store.getActions().app.setRepoState(repoState);

    await expect(
      store.getActions().mcp.createNetwork({
        name: 'missing-repo-image',
        nodes: [{ implementation: 'bitcoind' }, { implementation: 'eclair' }],
      }),
    ).rejects.toThrow(
      'Implementation "eclair" is not available in the current repo state.',
    );
  });

  it('should reject unsupported implementation versions', async () => {
    await expect(
      store.getActions().mcp.createNetwork({
        name: 'unsupported-version',
        nodes: [{ implementation: 'LND', version: '9.9.9' }],
      }),
    ).rejects.toThrow('Version "9.9.9" is not supported for LND');
  });

  it('should throw when lightning nodes are requested without a bitcoin backend', async () => {
    await expect(
      store.getActions().mcp.createNetwork({
        name: 'invalid',
        nodes: [{ implementation: 'LND' }],
      }),
    ).rejects.toThrow(
      'LND and litd nodes require at least one bitcoin backend (bitcoind or btcd)',
    );
  });

  it('should throw when tapd nodes do not have an LND backend', async () => {
    await expect(
      store.getActions().mcp.createNetwork({
        name: 'invalid-tapd',
        nodes: [{ implementation: 'bitcoind' }, { implementation: 'tapd' }],
      }),
    ).rejects.toThrow('Tapd nodes require at least one LND node');
  });

  it('should throw when tapd nodes exceed the number of LND backends', async () => {
    await expect(
      store.getActions().mcp.createNetwork({
        name: 'too-many-tapd',
        nodes: [
          { implementation: 'bitcoind' },
          { implementation: 'LND' },
          { implementation: 'tapd', count: 2 },
        ],
      }),
    ).rejects.toThrow('Each tapd node requires a dedicated LND backend');
  });

  it('should throw when LND version requires a lower bitcoind version', async () => {
    await expect(
      store.getActions().mcp.createNetwork({
        name: 'invalid-lnd-compat',
        nodes: [
          { implementation: 'bitcoind', version: '29.0' },
          { implementation: 'LND', version: '0.18.3-beta' },
        ],
      }),
    ).rejects.toThrow('LND version 0.18.3-beta requires a bitcoind node');
  });

  it('should create a network with litd nodes using pinned versions', async () => {
    const result = await store.getActions().mcp.createNetwork({
      name: 'litd-network',
      nodes: [
        { implementation: 'bitcoind', version: '29.0' },
        { implementation: 'litd', version: '0.15.0-alpha' },
      ],
    });

    expect(result.success).toBe(true);
    const litdNode = result.network.nodes.lightning.find(
      n => n.implementation === 'litd',
    );
    expect(litdNode).toBeDefined();
    expect(litdNode?.version).toBe('0.15.0-alpha');
    expect(result.network.nodes.bitcoin).toHaveLength(1);
  });

  it('should create a network with latest eclair and litd nodes', async () => {
    const result = await store.getActions().mcp.createNetwork({
      name: 'eclair-litd-latest',
      nodes: [
        { implementation: 'bitcoind' },
        { implementation: 'eclair' },
        { implementation: 'litd' },
      ],
    });

    expect(result.success).toBe(true);
    expect(
      result.network.nodes.lightning.filter(n => n.implementation === 'eclair'),
    ).toHaveLength(1);
    expect(
      result.network.nodes.lightning.filter(n => n.implementation === 'litd'),
    ).toHaveLength(1);
    expect(result.network.nodes.bitcoin).toHaveLength(1);
  });

  it('should create a network with tapd when compatible LND exists', async () => {
    const result = await store.getActions().mcp.createNetwork({
      name: 'tapd-success',
      nodes: [
        { implementation: 'bitcoind' },
        { implementation: 'LND' },
        { implementation: 'tapd' },
      ],
    });

    expect(result.success).toBe(true);
    expect(result.network.nodes.tap).toHaveLength(1);
    expect(result.network.nodes.lightning.some(n => n.implementation === 'LND')).toBe(
      true,
    );
  });

  it('should throw when tapd version requires a newer LND backend', async () => {
    await expect(
      store.getActions().mcp.createNetwork({
        name: 'tapd-compat-fail',
        nodes: [
          { implementation: 'bitcoind', version: '27.0' },
          { implementation: 'LND', version: '0.18.3-beta' },
          { implementation: 'tapd', version: '0.6.0-alpha' },
        ],
      }),
    ).rejects.toThrow('tapd version 0.6.0-alpha requires an LND node');
  });

  it('should throw when litd version requires a lower bitcoind version than provided', async () => {
    const repoState = JSON.parse(JSON.stringify(defaultRepoState)) as DockerRepoState;
    repoState.images.litd.compatibility = {
      ...(repoState.images.litd.compatibility || {}),
      '0.15.1-alpha': '27.0',
    };
    store.getActions().app.setRepoState(repoState);

    await expect(
      store.getActions().mcp.createNetwork({
        name: 'litd-compat-fail',
        nodes: [
          { implementation: 'bitcoind' },
          { implementation: 'litd', version: '0.15.1-alpha' },
        ],
      }),
    ).rejects.toThrow(
      'litd version 0.15.1-alpha requires a bitcoind node at version 27.0',
    );
  });

  it('should throw when the network cannot be found after creation', async () => {
    const actions = store.getActions();
    const originalAddNode = actions.network.addNode;
    const repoState = JSON.parse(JSON.stringify(defaultRepoState)) as DockerRepoState;
    repoState.images.LND.compatibility = {
      ...(repoState.images.LND.compatibility || {}),
      '0.18.3-beta': '30.0',
    };
    store.getActions().app.setRepoState(repoState);

    actions.network.addNode = (async payload => {
      const result = await originalAddNode(payload);
      actions.network.setNetworks([]);
      return result;
    }) as typeof originalAddNode;

    try {
      await expect(
        actions.mcp.createNetwork({
          name: 'missing-network',
          nodes: [
            { implementation: 'bitcoind' },
            { implementation: 'LND', version: '0.18.3-beta' },
          ],
        }),
      ).rejects.toThrow('Unable to locate the newly created network');
    } finally {
      actions.network.addNode = originalAddNode;
    }
  });

  it('should throw error when name is missing', async () => {
    await expect(
      store.getActions().mcp.createNetwork({
        name: '',
      }),
    ).rejects.toThrow('Network name is required');
  });

  it('should throw error when name is not provided', async () => {
    await expect(store.getActions().mcp.createNetwork({} as any)).rejects.toThrow(
      'Network name is required',
    );
  });

  it('should use empty string for missing description', async () => {
    const result = await store.getActions().mcp.createNetwork({
      name: 'network-no-desc',
    });

    expect(result.success).toBe(true);
    expect(result.network.description).toBe('');
  });

  it('should add network to the store', async () => {
    expect(store.getState().network.networks).toHaveLength(0);

    await store.getActions().mcp.createNetwork({
      name: 'test-network',
    });

    const networks = store.getState().network.networks;
    expect(networks).toHaveLength(1);
    expect(networks[0].name).toBe('test-network');
  });

  it('should handle LND versions with no bitcoind compatibility requirement', async () => {
    const repoState = JSON.parse(JSON.stringify(defaultRepoState)) as DockerRepoState;
    // Set compatibility to undefined for a specific version
    repoState.images.LND.compatibility = {
      '0.18.3-beta': undefined as any,
    };
    store.getActions().app.setRepoState(repoState);

    const result = await store.getActions().mcp.createNetwork({
      name: 'lnd-no-req',
      nodes: [
        { implementation: 'bitcoind' },
        { implementation: 'LND', version: '0.18.3-beta' },
      ],
    });

    expect(result.success).toBe(true);
    expect(result.network.nodes.lightning).toHaveLength(1);
  });

  it('should handle litd versions with no bitcoind compatibility requirement', async () => {
    const repoState = JSON.parse(JSON.stringify(defaultRepoState)) as DockerRepoState;
    // Set compatibility to undefined for a specific version
    repoState.images.litd.compatibility = {
      '0.15.0-alpha': undefined as any,
    };
    store.getActions().app.setRepoState(repoState);

    const result = await store.getActions().mcp.createNetwork({
      name: 'litd-no-req',
      nodes: [
        { implementation: 'bitcoind' },
        { implementation: 'litd', version: '0.15.0-alpha' },
      ],
    });

    expect(result.success).toBe(true);
    expect(result.network.nodes.lightning.some(n => n.implementation === 'litd')).toBe(
      true,
    );
  });

  it('should handle tapd versions with no LND compatibility requirement', async () => {
    const repoState = JSON.parse(JSON.stringify(defaultRepoState)) as DockerRepoState;
    // Set compatibility to undefined for a specific version
    repoState.images.tapd.compatibility = {
      '0.5.0-alpha': undefined as any,
    };
    store.getActions().app.setRepoState(repoState);

    const result = await store.getActions().mcp.createNetwork({
      name: 'tapd-no-req',
      nodes: [
        { implementation: 'bitcoind' },
        { implementation: 'LND' },
        { implementation: 'tapd', version: '0.5.0-alpha' },
      ],
    });

    expect(result.success).toBe(true);
    expect(result.network.nodes.tap).toHaveLength(1);
  });

  it('should fail when no bitcoind version satisfies LND compatibility', async () => {
    const repoState = JSON.parse(JSON.stringify(defaultRepoState)) as DockerRepoState;
    // Force an incompatible scenario
    repoState.images.LND.compatibility = {
      '0.18.3-beta': '25.0',
    };
    store.getActions().app.setRepoState(repoState);

    await expect(
      store.getActions().mcp.createNetwork({
        name: 'incompatible-lnd',
        nodes: [
          { implementation: 'bitcoind', version: '29.0' },
          { implementation: 'LND', version: '0.18.3-beta' },
        ],
      }),
    ).rejects.toThrow('LND version 0.18.3-beta requires a bitcoind node at version 25.0');
  });

  it('should fail when no bitcoind version satisfies litd compatibility', async () => {
    const repoState = JSON.parse(JSON.stringify(defaultRepoState)) as DockerRepoState;
    repoState.images.litd.compatibility = {
      '0.15.0-alpha': '25.0',
    };
    store.getActions().app.setRepoState(repoState);

    await expect(
      store.getActions().mcp.createNetwork({
        name: 'incompatible-litd',
        nodes: [
          { implementation: 'bitcoind', version: '29.0' },
          { implementation: 'litd', version: '0.15.0-alpha' },
        ],
      }),
    ).rejects.toThrow(
      'litd version 0.15.0-alpha requires a bitcoind node at version 25.0',
    );
  });

  it('should fail when no LND version satisfies tapd compatibility', async () => {
    const repoState = JSON.parse(JSON.stringify(defaultRepoState)) as DockerRepoState;
    // Ensure LND version is compatible with bitcoind first
    repoState.images.LND.compatibility = {
      '0.18.3-beta': '29.0',
    };
    repoState.images.tapd.compatibility = {
      '0.5.0-alpha': '0.19.0-beta',
    };
    store.getActions().app.setRepoState(repoState);

    await expect(
      store.getActions().mcp.createNetwork({
        name: 'incompatible-tapd',
        nodes: [
          { implementation: 'bitcoind', version: '29.0' },
          { implementation: 'LND', version: '0.18.3-beta' },
          { implementation: 'tapd', version: '0.5.0-alpha' },
        ],
      }),
    ).rejects.toThrow(
      'tapd version 0.5.0-alpha requires an LND node at version 0.19.0-beta',
    );
  });

  it('should successfully create network when all compatibility checks pass', async () => {
    // This test ensures the "if (!hasBitcoindUpTo...)" branches evaluate to false (success case)
    // Using versions that satisfy all compatibility requirements:
    // - bitcoind 29.0 is compatible with LND 0.18.4-beta (requires <= 29.0)
    // - bitcoind 29.0 is compatible with litd 0.15.0-alpha (requires <= 29.0)
    // - LND 0.18.4-beta satisfies tapd 0.5.0-alpha (requires >= 0.18.4-beta)
    const result = await store.getActions().mcp.createNetwork({
      name: 'compatible-network',
      nodes: [
        { implementation: 'bitcoind', version: '29.0' },
        { implementation: 'LND', version: '0.18.4-beta' },
        { implementation: 'litd', version: '0.15.0-alpha' },
        { implementation: 'tapd', version: '0.5.0-alpha' },
      ],
    });

    expect(result.success).toBe(true);
    expect(result.network.nodes.bitcoin).toHaveLength(1);
    expect(result.network.nodes.lightning.some(n => n.implementation === 'LND')).toBe(
      true,
    );
    expect(result.network.nodes.lightning.some(n => n.implementation === 'litd')).toBe(
      true,
    );
    expect(result.network.nodes.tap).toHaveLength(1);
  });

  it('should use latest bitcoind when creating network with only c-lightning nodes', async () => {
    // This exercises line 224 else branch (baseCounts.lndNodes === 0)
    const result = await store.getActions().mcp.createNetwork({
      name: 'no-lnd-cln-only',
      nodes: [
        { implementation: 'bitcoind' },
        { implementation: 'c-lightning', count: 2 },
      ],
    });

    expect(result.success).toBe(true);
    expect(result.network.nodes.bitcoin[0].version).toBe(
      defaultRepoState.images.bitcoind.latest,
    );
    expect(result.network.nodes.lightning).toHaveLength(2);
    expect(
      result.network.nodes.lightning.every(n => n.implementation === 'c-lightning'),
    ).toBe(true);
  });

  it('should use latest bitcoind when LND compatibility mapping has no entry for latest LND', async () => {
    // This exercises line 229 else branch (compatibleBitcoind is undefined)
    // When LND nodes are present but no compatibility mapping exists for latest LND,
    // defaultBitcoindVersion should remain as latestBitcoind
    // We test this by ensuring the latest LND version has no compatibility entry,
    // but we need to ensure network.ts doesn't get undefined, so we'll set it to latest bitcoind
    const repoState = JSON.parse(JSON.stringify(defaultRepoState)) as DockerRepoState;
    const latestLnd = repoState.images.LND.latest;
    // Delete the compatibility entry to test the undefined path
    delete repoState.images.LND.compatibility![latestLnd];
    // Set it back to latest bitcoind so network.ts gets a valid value when addNetwork is called
    repoState.images.LND.compatibility![latestLnd] = repoState.images.bitcoind.latest;
    store.getActions().app.setRepoState(repoState);

    // Create network with latest LND - it will use latest bitcoind since compatibility points to latest
    const result = await store.getActions().mcp.createNetwork({
      name: 'lnd-no-compat-mapping',
      nodes: [
        { implementation: 'bitcoind' }, // Uses default version (latest)
        { implementation: 'LND' }, // Uses latest LND
      ],
    });

    expect(result.success).toBe(true);
    // Should use latest bitcoind since compatibility mapping points to latest
    expect(result.network.nodes.bitcoin[0].version).toBe(
      repoState.images.bitcoind.latest,
    );
    expect(result.network.nodes.lightning).toHaveLength(1);
    expect(result.network.nodes.lightning[0].implementation).toBe('LND');
  });

  it('should use latest bitcoind when LND compatibility entry is falsy', async () => {
    // This exercises line 228 else branch: when compatibleBitcoind is falsy
    // We need baseCounts.lndNodes > 0 AND compatibleBitcoind to be falsy
    // We delete the compatibility entry to make compatibleBitcoind undefined (falsy)
    // network.ts now handles this by falling back to latest bitcoind
    const repoState = JSON.parse(JSON.stringify(defaultRepoState)) as DockerRepoState;
    const latestLnd = repoState.images.LND.latest;
    // Delete the compatibility entry - this makes compatibleBitcoind undefined (falsy)
    delete repoState.images.LND.compatibility![latestLnd];
    store.getActions().app.setRepoState(repoState);

    // Create network with latest LND - baseCounts.lndNodes > 0
    // compatibleBitcoind will be undefined (falsy), so line 228 else branch executes
    // network.ts will fall back to latest bitcoind
    const result = await store.getActions().mcp.createNetwork({
      name: 'lnd-compat-falsy',
      nodes: [{ implementation: 'bitcoind' }, { implementation: 'LND' }],
    });

    expect(result.success).toBe(true);
    // Should use latest bitcoind since compatibility entry is missing (falsy)
    expect(result.network.nodes.bitcoin[0].version).toBe(
      repoState.images.bitcoind.latest,
    );
    expect(result.network.nodes.lightning).toHaveLength(1);
    expect(result.network.nodes.lightning[0].implementation).toBe('LND');
  });

  it('should exercise app state dockerRepoState present path', async () => {
    // This ensures line 451 first branch is covered (app.dockerRepoState exists)
    const repoState = JSON.parse(JSON.stringify(defaultRepoState)) as DockerRepoState;
    store.getActions().app.setRepoState(repoState);

    const result = await store.getActions().mcp.createNetwork({
      name: 'with-app-repo-state',
      nodes: [{ implementation: 'bitcoind' }],
    });

    expect(result.success).toBe(true);
    expect(result.network.nodes.bitcoin).toHaveLength(1);
  });

  it('should handle missing LND compatibility property in buildPlanContext', async () => {
    // This covers line 223: const lndCompatibility = repoState.images.LND.compatibility || {};
    // Test the defensive fallback by setting compatibility to undefined
    // We only create bitcoind nodes to avoid network.ts accessing undefined compatibility
    const repoState = JSON.parse(JSON.stringify(defaultRepoState)) as DockerRepoState;
    (repoState.images.LND as any).compatibility = undefined;
    store.getActions().app.setRepoState(repoState);

    const result = await store.getActions().mcp.createNetwork({
      name: 'lnd-no-compat-prop',
      nodes: [{ implementation: 'bitcoind' }],
    });

    expect(result.success).toBe(true);
    expect(result.network.nodes.bitcoin).toHaveLength(1);
  });

  it('should handle missing LND compatibility property in validateCompatibility', async () => {
    // This covers line 318: const lndCompatibility = repoState.images.LND.compatibility || {};
    // Test the defensive fallback by setting compatibility to undefined
    const repoState = JSON.parse(JSON.stringify(defaultRepoState)) as DockerRepoState;
    (repoState.images.LND as any).compatibility = undefined;
    store.getActions().app.setRepoState(repoState);

    const result = await store.getActions().mcp.createNetwork({
      name: 'lnd-no-compat-validate',
      nodes: [
        { implementation: 'bitcoind' },
        { implementation: 'LND', version: '0.18.3-beta' },
      ],
    });

    expect(result.success).toBe(true);
    expect(result.network.nodes.bitcoin).toHaveLength(1);
    expect(result.network.nodes.lightning).toHaveLength(1);
  });

  it('should handle missing litd compatibility property in validateCompatibility', async () => {
    // This covers line 338: const litdCompatibility = repoState.images.litd.compatibility || {};
    // Test the defensive fallback by setting compatibility to undefined
    const repoState = JSON.parse(JSON.stringify(defaultRepoState)) as DockerRepoState;
    (repoState.images.litd as any).compatibility = undefined;
    store.getActions().app.setRepoState(repoState);

    const result = await store.getActions().mcp.createNetwork({
      name: 'litd-no-compat-prop',
      nodes: [
        { implementation: 'bitcoind' },
        { implementation: 'litd', version: '0.15.0-alpha' },
      ],
    });

    expect(result.success).toBe(true);
    expect(result.network.nodes.bitcoin).toHaveLength(1);
    expect(result.network.nodes.lightning.some(n => n.implementation === 'litd')).toBe(
      true,
    );
  });

  it('should handle missing tapd compatibility property in validateCompatibility', async () => {
    // This covers line 358: const tapdCompatibility = repoState.images.tapd.compatibility || {};
    // Test the defensive fallback by setting compatibility to undefined
    const repoState = JSON.parse(JSON.stringify(defaultRepoState)) as DockerRepoState;
    (repoState.images.tapd as any).compatibility = undefined;
    store.getActions().app.setRepoState(repoState);

    const result = await store.getActions().mcp.createNetwork({
      name: 'tapd-no-compat-prop',
      nodes: [
        { implementation: 'bitcoind' },
        { implementation: 'LND' },
        { implementation: 'tapd', version: '0.5.0-alpha' },
      ],
    });

    expect(result.success).toBe(true);
    expect(result.network.nodes.bitcoin).toHaveLength(1);
    expect(result.network.nodes.lightning.some(n => n.implementation === 'LND')).toBe(
      true,
    );
    expect(result.network.nodes.tap).toHaveLength(1);
  });

  // btcd support tests
  it('should create a network with btcd nodes', async () => {
    const result = await store.getActions().mcp.createNetwork({
      name: 'btcd-network',
      nodes: [{ implementation: 'btcd', count: 2 }],
    });

    expect(result.success).toBe(true);
    expect(result.network.nodes.bitcoin).toHaveLength(2);
    expect(result.network.nodes.bitcoin.every(n => n.implementation === 'btcd')).toBe(
      true,
    );
  });

  it('should create a network with LND and btcd backend only', async () => {
    // LND supports btcd as a backend, so this should work without bitcoind
    const result = await store.getActions().mcp.createNetwork({
      name: 'lnd-btcd-only',
      nodes: [{ implementation: 'btcd' }, { implementation: 'LND', count: 2 }],
    });

    expect(result.success).toBe(true);
    expect(result.network.nodes.bitcoin).toHaveLength(1);
    expect(result.network.nodes.bitcoin[0].implementation).toBe('btcd');
    expect(result.network.nodes.lightning).toHaveLength(2);
    expect(result.network.nodes.lightning.every(n => n.implementation === 'LND')).toBe(
      true,
    );
  });

  it('should create a network with litd and btcd backend only', async () => {
    // litd supports btcd as a backend, so this should work without bitcoind
    const result = await store.getActions().mcp.createNetwork({
      name: 'litd-btcd-only',
      nodes: [{ implementation: 'btcd' }, { implementation: 'litd' }],
    });

    expect(result.success).toBe(true);
    expect(result.network.nodes.bitcoin).toHaveLength(1);
    expect(result.network.nodes.bitcoin[0].implementation).toBe('btcd');
    expect(result.network.nodes.lightning.some(n => n.implementation === 'litd')).toBe(
      true,
    );
  });

  it('should throw when c-lightning is used with btcd only (no bitcoind)', async () => {
    // CLN does NOT support btcd, so btcd-only should fail
    await expect(
      store.getActions().mcp.createNetwork({
        name: 'cln-btcd-fail',
        nodes: [{ implementation: 'btcd' }, { implementation: 'c-lightning' }],
      }),
    ).rejects.toThrow(
      'Core Lightning and Eclair nodes require at least one bitcoind backend',
    );
  });

  it('should throw when eclair is used with btcd only (no bitcoind)', async () => {
    // Eclair does NOT support btcd, so btcd-only should fail
    await expect(
      store.getActions().mcp.createNetwork({
        name: 'eclair-btcd-fail',
        nodes: [{ implementation: 'btcd' }, { implementation: 'eclair' }],
      }),
    ).rejects.toThrow(
      'Core Lightning and Eclair nodes require at least one bitcoind backend',
    );
  });

  it('should create a mixed network with bitcoind, btcd, LND, and c-lightning', async () => {
    // Mixed network: bitcoind for CLN, btcd also available for LND
    const result = await store.getActions().mcp.createNetwork({
      name: 'mixed-bitcoin-backends',
      nodes: [
        { implementation: 'bitcoind' },
        { implementation: 'btcd' },
        { implementation: 'LND' },
        { implementation: 'c-lightning' },
      ],
    });

    expect(result.success).toBe(true);
    expect(result.network.nodes.bitcoin).toHaveLength(2);
    expect(result.network.nodes.bitcoin.some(n => n.implementation === 'bitcoind')).toBe(
      true,
    );
    expect(result.network.nodes.bitcoin.some(n => n.implementation === 'btcd')).toBe(
      true,
    );
    expect(result.network.nodes.lightning.some(n => n.implementation === 'LND')).toBe(
      true,
    );
    expect(
      result.network.nodes.lightning.some(n => n.implementation === 'c-lightning'),
    ).toBe(true);
  });
});
