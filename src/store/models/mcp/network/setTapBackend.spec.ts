import { createStore } from 'easy-peasy';
import { Status, TapdNode } from 'shared/types';
import { initChartFromNetwork } from 'utils/chart';
import { exists } from 'utils/files';
import { createMockRootModel, getNetwork, injections } from 'utils/tests';

jest.mock('utils/files');

const existsMock = exists as jest.MockedFunction<typeof exists>;

describe('MCP model > setTapBackend', () => {
  const rootModel = createMockRootModel();

  // initialize store for type inference
  let store = createStore(rootModel, { injections });

  beforeEach(() => {
    // reset the store before each test run
    store = createStore(rootModel, { injections });
    jest.clearAllMocks();
  });

  it('should set TAP backend successfully', async () => {
    // Create a network with TAP nodes (2 TAP nodes and 2 LND nodes)
    const network = getNetwork(1, 'test-network', Status.Stopped, 2);
    store.getActions().network.setNetworks([network]);
    const chart = initChartFromNetwork(network);
    store.getActions().designer.setChart({ id: network.id, chart });
    store.getActions().designer.setActiveId(network.id);

    const result = await store.getActions().mcp.setTapBackend({
      networkId: network.id,
      tapNodeName: 'alice-tap',
      lndNodeName: 'bob',
    });

    expect(result.success).toBe(true);
    expect(result.message).toContain('Successfully changed backend');
    expect(result.message).toContain('alice-tap');
    expect(result.message).toContain('bob');
    expect(result.message).toContain('test-network');
    expect(result.networkId).toBe(network.id);
    expect(result.tapNodeName).toBe('alice-tap');
    expect(result.lndNodeName).toBe('bob');

    // Verify the backend was actually changed
    const updatedNetwork = store.getState().network.networks[0];
    expect((updatedNetwork.nodes.tap[0] as TapdNode).lndName).toBe('bob');
  });

  it('should throw error when networkId is missing', async () => {
    await expect(
      store.getActions().mcp.setTapBackend({
        tapNodeName: 'alice-tap',
        lndNodeName: 'bob',
      } as any),
    ).rejects.toThrow('Network ID is required');
  });

  it('should throw error when tapNodeName is missing', async () => {
    await expect(
      store.getActions().mcp.setTapBackend({
        networkId: 1,
        lndNodeName: 'bob',
      } as any),
    ).rejects.toThrow('TAP node name is required');
  });

  it('should throw error when lndNodeName is missing', async () => {
    await expect(
      store.getActions().mcp.setTapBackend({
        networkId: 1,
        tapNodeName: 'alice-tap',
      } as any),
    ).rejects.toThrow('LND node name is required');
  });

  it('should throw error when network does not exist', async () => {
    await expect(
      store.getActions().mcp.setTapBackend({
        networkId: 9999,
        tapNodeName: 'alice-tap',
        lndNodeName: 'bob',
      }),
    ).rejects.toThrow("Network with the id '9999' was not found");
  });

  it('should throw error when TAP node does not exist', async () => {
    const network = getNetwork(1, 'test-network', Status.Stopped, 2);
    store.getActions().network.setNetworks([network]);

    await expect(
      store.getActions().mcp.setTapBackend({
        networkId: network.id,
        tapNodeName: 'nonexistent',
        lndNodeName: 'bob',
      }),
    ).rejects.toThrow('Tap node "nonexistent" not found in network');
  });

  it('should throw error when LND node does not exist', async () => {
    const network = getNetwork(1, 'test-network', Status.Stopped, 2);
    store.getActions().network.setNetworks([network]);

    await expect(
      store.getActions().mcp.setTapBackend({
        networkId: network.id,
        tapNodeName: 'alice-tap',
        lndNodeName: 'nonexistent',
      }),
    ).rejects.toThrow('Lightning node "nonexistent" not found in network');
  });

  it('should throw error when trying to set the same backend', async () => {
    const network = getNetwork(1, 'test-network', Status.Stopped, 2);
    store.getActions().network.setNetworks([network]);
    const chart = initChartFromNetwork(network);
    store.getActions().designer.setChart({ id: network.id, chart });
    store.getActions().designer.setActiveId(network.id);

    // Ensure compatible versions for this test
    const updatedNetwork = { ...network };
    updatedNetwork.nodes.tap[0].version = '0.3.3-alpha'; // TAP version that requires LND >= 0.16.0-beta
    updatedNetwork.nodes.lightning[0].version = '0.16.0-beta'; // alice LND version (compatible)
    store.getActions().network.setNetworks([updatedNetwork]);

    await expect(
      store.getActions().mcp.setTapBackend({
        networkId: network.id,
        tapNodeName: 'alice-tap',
        lndNodeName: 'alice', // alice-tap is already connected to alice
      }),
    ).rejects.toThrow('already connected');
  });

  it('should throw error when LND version is incompatible (too low)', async () => {
    const network = getNetwork(1, 'test-network', Status.Stopped, 2);
    store.getActions().network.setNetworks([network]);
    const chart = initChartFromNetwork(network);
    store.getActions().designer.setChart({ id: network.id, chart });
    store.getActions().designer.setActiveId(network.id);

    // Update network with specific versions that trigger incompatibility
    // TAP 0.3.3-alpha requires LND 0.16.0-beta minimum
    // We'll use LND 0.15.0-beta which is lower than required
    const updatedNetwork = { ...network };
    updatedNetwork.nodes.tap[0].version = '0.3.3-alpha'; // TAP version that requires LND >= 0.16.0-beta
    updatedNetwork.nodes.lightning[1].version = '0.15.0-beta'; // LND version lower than required

    store.getActions().network.setNetworks([updatedNetwork]);

    await expect(
      store.getActions().mcp.setTapBackend({
        networkId: network.id,
        tapNodeName: 'alice-tap',
        lndNodeName: 'bob', // bob has version 0.15.0-beta (lower than 0.16.0-beta required)
      }),
    ).rejects.toThrow('is not compatible');
  });

  it('should not perform compatibility check when TAP version has no compatibility data', async () => {
    const network = getNetwork(1, 'test-network', Status.Stopped, 2);
    store.getActions().network.setNetworks([network]);
    const chart = initChartFromNetwork(network);
    store.getActions().designer.setChart({ id: network.id, chart });
    store.getActions().designer.setActiveId(network.id);

    // Update network with TAP version that has no compatibility data
    const updatedNetwork = { ...network };
    updatedNetwork.nodes.tap[0].version = '0.2.0-alpha'; // Version not in compatibility mapping

    store.getActions().network.setNetworks([updatedNetwork]);

    const result = await store.getActions().mcp.setTapBackend({
      networkId: network.id,
      tapNodeName: 'alice-tap',
      lndNodeName: 'bob',
    });

    expect(result.success).toBe(true);
  });

  it('should throw error when TAP node has been started before', async () => {
    const network = getNetwork(1, 'test-network', Status.Stopped, 2);
    store.getActions().network.setNetworks([network]);
    const chart = initChartFromNetwork(network);
    store.getActions().designer.setChart({ id: network.id, chart });
    store.getActions().designer.setActiveId(network.id);

    // Mock exists to return true (macaroon exists, node has been started)
    existsMock.mockResolvedValue(true);

    await expect(
      store.getActions().mcp.setTapBackend({
        networkId: network.id,
        tapNodeName: 'alice-tap',
        lndNodeName: 'bob',
      }),
    ).rejects.toThrow(
      'Cannot change backend for TAP node "alice-tap" because it has been started before. This would result in asset loss.',
    );
  });
});
