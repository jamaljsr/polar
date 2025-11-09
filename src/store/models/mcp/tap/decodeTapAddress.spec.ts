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
import { DecodeTapAddressArgs, decodeTapAddressDefinition } from './decodeTapAddress';

jest.mock('electron-log');

describe('decodeTapAddress Tool', () => {
  const rootModel = createMockRootModel();
  let store = createStore(rootModel, { injections });

  beforeEach(() => {
    store = createStore(rootModel, { injections });
  });

  it('should have correct definition', () => {
    expect(decodeTapAddressDefinition.name).toBe('decode_tap_address');
    expect(decodeTapAddressDefinition.description).toBe('Decode Taproot Asset address');
    expect(decodeTapAddressDefinition.inputSchema).toBeDefined();
    expect(decodeTapAddressDefinition.inputSchema.properties.networkId.description).toBe(
      'ID of the network',
    );
  });

  it('should call tap.decodeAddress', async () => {
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

    const spy = jest.spyOn(store.getActions().tap, 'decodeAddress').mockResolvedValue({
      encoded: 'test-address',
      id: 'test-asset',
      amount: '100',
      name: 'test-name',
      type: 'test-type',
      family: 'test-family',
      scriptKey: 'test-script-key',
      internalKey: 'test-internal-key',
      taprootOutputKey: 'test-taproot-output-key',
    });

    const args: DecodeTapAddressArgs = {
      networkId: 1,
      nodeName: node.name,
      address: 'test-address',
    };
    await store.getActions().mcp.decodeTapAddress(args);
    expect(spy).toHaveBeenCalledWith({
      node,
      address: 'test-address',
    });
  });

  it('should throw error if networkId is missing', async () => {
    const args = { nodeName: 'test-node', address: 'test-address' } as any;
    await expect(store.getActions().mcp.decodeTapAddress(args)).rejects.toThrow(
      'Network ID is required',
    );
  });

  it('should throw error if nodeName is missing', async () => {
    const args = { networkId: 1, address: 'test-address' } as any;
    await expect(store.getActions().mcp.decodeTapAddress(args)).rejects.toThrow(
      'Node name is required',
    );
  });

  it('should throw error if address is missing', async () => {
    const args = { networkId: 1, nodeName: 'test-node' } as any;
    await expect(store.getActions().mcp.decodeTapAddress(args)).rejects.toThrow(
      'Address is required',
    );
  });
});
