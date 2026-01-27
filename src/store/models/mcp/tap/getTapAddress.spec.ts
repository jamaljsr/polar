import { createStore } from 'easy-peasy';
import { Status } from 'shared/types';
import { createTapdNetworkNode } from 'utils/network';
import {
  createMockRootModel,
  getNetwork,
  injections,
  testNodeDocker,
  testRepoState,
} from 'utils/tests';
import { GetTapAddressArgs, getTapAddressDefinition } from './getTapAddress';

jest.mock('electron-log');

describe('getTapAddress Tool', () => {
  const rootModel = createMockRootModel();
  let store = createStore(rootModel, { injections });

  beforeEach(() => {
    store = createStore(rootModel, { injections });
  });

  it('should have correct definition', () => {
    expect(getTapAddressDefinition.name).toBe('get_tap_address');
    expect(getTapAddressDefinition.description).toBe('Generate Taproot Asset address');
    expect(getTapAddressDefinition.inputSchema).toBeDefined();
    const networkId = getTapAddressDefinition.inputSchema.properties.networkId as any;
    expect(networkId.description).toBe('ID of the network');
  });

  it('should call tap.getNewAddress', async () => {
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

    const spy = jest.spyOn(store.getActions().tap, 'getNewAddress').mockResolvedValue({
      encoded: 'test-address',
      id: 'test-asset',
      amount: '100',
      type: 'test-type',
      family: 'test-family',
      scriptKey: 'test-script-key',
      internalKey: 'test-internal-key',
      taprootOutputKey: 'test-taproot-output-key',
    });

    const args: GetTapAddressArgs = {
      networkId: 1,
      nodeName: node.name,
      assetId: 'test-asset',
      amount: '100',
    };
    const result = await store.getActions().mcp.getTapAddress(args);
    expect(result.encoded).toBe('test-address');
    expect(spy).toHaveBeenCalledWith({
      node,
      assetId: 'test-asset',
      amount: '100',
    });
  });

  it('should throw error if networkId is missing', async () => {
    const args = {
      nodeName: 'test-node',
      assetId: 'test-asset',
      amount: '100',
    } as any;
    await expect(store.getActions().mcp.getTapAddress(args)).rejects.toThrow(
      'Network ID is required',
    );
  });

  it('should throw error if nodeName is missing', async () => {
    const args = {
      networkId: 1,
      assetId: 'test-asset',
      amount: '100',
    } as any;
    await expect(store.getActions().mcp.getTapAddress(args)).rejects.toThrow(
      'Node name is required',
    );
  });

  it('should throw error if assetId is missing', async () => {
    const args = {
      networkId: 1,
      nodeName: 'test-node',
      amount: '100',
    } as any;
    await expect(store.getActions().mcp.getTapAddress(args)).rejects.toThrow(
      'Asset ID is required',
    );
  });

  it('should throw error if amount is missing', async () => {
    const args = {
      networkId: 1,
      nodeName: 'test-node',
      assetId: 'test-asset',
    } as any;
    await expect(store.getActions().mcp.getTapAddress(args)).rejects.toThrow(
      'Amount is required',
    );
  });
});
