import { createStore } from 'easy-peasy';
import { Status } from 'shared/types';
import { createLitdNetworkNode, createTapdNetworkNode } from 'utils/network';
import {
  createMockRootModel,
  getNetwork,
  injections,
  testNodeDocker,
  testRepoState,
} from 'utils/tests';
import { SyncTapUniverseArgs, syncTapUniverseDefinition } from './syncTapUniverse';

jest.mock('electron-log');

describe('syncTapUniverse Tool', () => {
  const rootModel = createMockRootModel();
  let store = createStore(rootModel, { injections });

  beforeEach(() => {
    store = createStore(rootModel, { injections });
  });

  it('should have correct definition', () => {
    expect(syncTapUniverseDefinition.name).toBe('sync_tap_universe');
    expect(syncTapUniverseDefinition.description).toBe(
      'Sync with Taproot Assets universe',
    );
    expect(syncTapUniverseDefinition.inputSchema).toBeDefined();
    expect(syncTapUniverseDefinition.inputSchema.properties.networkId.description).toBe(
      'ID of the network',
    );
  });

  it('should call tap.syncUniverse', async () => {
    const network = getNetwork(1, 'test network', Status.Started);
    const tapdNode = createTapdNetworkNode(
      network,
      testRepoState.images.tapd.latest,
      testRepoState.images.tapd.compatibility,
      testNodeDocker,
    );
    network.nodes.tap.push(tapdNode);
    store.getActions().network.setNetworks([network]);
    const node = network.nodes.tap[0];
    expect(node).toBeDefined();

    const spy = jest.spyOn(store.getActions().tap, 'syncUniverse').mockResolvedValue(0);

    const args: SyncTapUniverseArgs = {
      networkId: 1,
      nodeName: node.name,
      universeNodeName: node.name,
    };
    const result = await store.getActions().mcp.syncTapUniverse(args);
    expect(spy).toHaveBeenCalledWith({
      node,
      hostname: `${node.name}:10029`,
    });
    expect(result).toEqual({ syncedAssets: 0 });
  });

  it('should call tap.syncUniverse for litd', async () => {
    const network = getNetwork(1, 'test network', Status.Started);
    const litdNode = createLitdNetworkNode(
      network,
      testRepoState.images.litd.latest,
      testRepoState.images.litd.compatibility,
      testNodeDocker,
    );
    network.nodes.tap.push(litdNode as any);
    store.getActions().network.setNetworks([network]);
    const node = network.nodes.tap[0];
    expect(node).toBeDefined();

    const spy = jest.spyOn(store.getActions().tap, 'syncUniverse').mockResolvedValue(10);

    const args: SyncTapUniverseArgs = {
      networkId: 1,
      nodeName: node.name,
      universeNodeName: node.name,
    };
    const result = await store.getActions().mcp.syncTapUniverse(args);
    expect(spy).toHaveBeenCalledWith({
      node,
      hostname: `${node.name}:8443`,
    });
    expect(result).toEqual({ syncedAssets: 10 });
  });

  it('should throw error if networkId is missing', async () => {
    const args = { nodeName: 'test-node', universeNodeName: 'test-host' } as any;
    await expect(store.getActions().mcp.syncTapUniverse(args)).rejects.toThrow(
      'Network ID is required',
    );
  });

  it('should throw error if nodeName is missing', async () => {
    const args = { networkId: 1, universeNodeName: 'test-host' } as any;
    await expect(store.getActions().mcp.syncTapUniverse(args)).rejects.toThrow(
      'Node name is required',
    );
  });

  it('should throw error if universeNodeName is missing', async () => {
    const args = { networkId: 1, nodeName: 'test-node' } as any;
    await expect(store.getActions().mcp.syncTapUniverse(args)).rejects.toThrow(
      'Universe node name is required',
    );
  });
});
