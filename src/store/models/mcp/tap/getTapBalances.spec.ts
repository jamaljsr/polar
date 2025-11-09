import { createStore } from 'easy-peasy';
import { Status } from 'shared/types';
import { createLitdNetworkNode } from 'utils/network';
import {
  createMockRootModel,
  getNetwork,
  injections,
  tapServiceMock,
  testNodeDocker,
  testRepoState,
} from 'utils/tests';
import { GetTapBalancesArgs, getTapBalancesDefinition } from './getTapBalances';

jest.mock('electron-log');

describe('getTapBalances Tool', () => {
  const rootModel = createMockRootModel();

  // initialize store for type inference
  let store = createStore(rootModel, { injections });

  beforeEach(() => {
    // reset the store before each test run
    store = createStore(rootModel, { injections });
  });

  describe('getTapBalancesDefinition', () => {
    it('should have correct name', () => {
      expect(getTapBalancesDefinition.name).toBe('get_tap_balances');
    });

    it('should have a description', () => {
      expect(getTapBalancesDefinition.description).toBeTruthy();
      expect(getTapBalancesDefinition.description).toContain(
        'Get all Taproot Asset balances',
      );
    });

    it('should have input schema with required fields', () => {
      expect(getTapBalancesDefinition.inputSchema.type).toBe('object');
      expect(getTapBalancesDefinition.inputSchema.properties).toHaveProperty('networkId');
      expect(getTapBalancesDefinition.inputSchema.properties).toHaveProperty('nodeName');
      expect(getTapBalancesDefinition.inputSchema.required).toEqual([
        'networkId',
        'nodeName',
      ]);
    });
  });

  describe('getTapBalancesTool', () => {
    it('should get balances successfully', async () => {
      const network = getNetwork(1, 'test', Status.Started, 1);
      store.getActions().network.setNetworks([network]);

      const mockApiBalances = {
        balances: [
          {
            id: 'asset1',
            name: 'Asset One',
            balance: '1000',
            type: 'normal',
            genesisPoint: 'gp1',
          },
          {
            id: 'asset2',
            name: 'Asset Two',
            balance: '1',
            type: 'collectible',
            genesisPoint: 'gp2',
          },
        ],
      };
      const spy = jest
        .spyOn(store.getActions().tap, 'getBalances')
        .mockImplementation(async node => {
          store.getActions().tap.setBalances({
            node,
            balances: mockApiBalances.balances,
          });
        });

      const args: GetTapBalancesArgs = {
        networkId: network.id,
        nodeName: network.nodes.tap[0].name,
      };

      const result = await store.getActions().mcp.getTapBalances(args);

      expect(result).toEqual(mockApiBalances);
      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({ name: network.nodes.tap[0].name }),
      );
    });

    it('should return an empty object if there are no balances', async () => {
      const network = getNetwork(1, 'test', Status.Started, 1);
      store.getActions().network.setNetworks([network]);

      tapServiceMock.listBalances.mockResolvedValue(undefined as any);

      const args: GetTapBalancesArgs = {
        networkId: network.id,
        nodeName: network.nodes.tap[0].name,
      };

      const result = await store.getActions().mcp.getTapBalances(args);

      expect(result).toEqual({ balances: [] });
    });

    it('should throw error if networkId is missing', async () => {
      const args = {
        nodeName: 'tapd1',
      } as any;

      await expect(store.getActions().mcp.getTapBalances(args)).rejects.toThrow(
        'Network ID is required',
      );
    });

    it('should throw error if nodeName is missing', async () => {
      const args = {
        networkId: 1,
      } as any;

      await expect(store.getActions().mcp.getTapBalances(args)).rejects.toThrow(
        'Node name is required',
      );
    });

    it('should throw error if network not found', async () => {
      const network = getNetwork(1, 'test', Status.Started, 1);
      store.getActions().network.setNetworks([network]);

      const args: GetTapBalancesArgs = {
        networkId: 99999,
        nodeName: 'tapd1',
      };

      await expect(store.getActions().mcp.getTapBalances(args)).rejects.toThrow(
        "Network with the id '99999' was not found.",
      );
    });

    it('should throw error if node not found', async () => {
      const network = getNetwork(1, 'test', Status.Started, 1);
      store.getActions().network.setNetworks([network]);

      const args: GetTapBalancesArgs = {
        networkId: network.id,
        nodeName: 'nonexistent',
      };

      await expect(store.getActions().mcp.getTapBalances(args)).rejects.toThrow(
        'Tap node "nonexistent" not found in network',
      );
    });

    it('should handle getBalances failure', async () => {
      const network = getNetwork(1, 'test', Status.Started, 1);
      store.getActions().network.setNetworks([network]);

      jest
        .spyOn(store.getActions().tap, 'getBalances')
        .mockRejectedValue(new Error('Failed to get balances'));

      const args: GetTapBalancesArgs = {
        networkId: network.id,
        nodeName: network.nodes.tap[0].name,
      };

      await expect(store.getActions().mcp.getTapBalances(args)).rejects.toThrow(
        'Failed to get balances',
      );
    });

    it('should get balances from a litd node', async () => {
      const network = getNetwork(1, 'test', Status.Started);
      const litdNode = createLitdNetworkNode(
        network,
        testRepoState.images.litd.latest,
        testRepoState.images.litd.compatibility,
        testNodeDocker,
      );
      network.nodes.lightning.push(litdNode);
      store.getActions().network.setNetworks([network]);

      const mockApiBalances = {
        balances: [
          {
            id: 'litdAsset',
            name: 'Litd Asset',
            balance: '500',
            type: 'normal',
            genesisPoint: 'gp-litd',
          },
        ],
      };
      const spy = jest
        .spyOn(store.getActions().tap, 'getBalances')
        .mockImplementation(async node => {
          store.getActions().tap.setBalances({
            node,
            balances: mockApiBalances.balances,
          });
        });

      const args: GetTapBalancesArgs = {
        networkId: network.id,
        nodeName: litdNode.name,
      };

      const result = await store.getActions().mcp.getTapBalances(args);

      expect(result).toEqual(mockApiBalances);
      expect(spy).toHaveBeenCalledWith(expect.objectContaining({ name: litdNode.name }));
    });
  });
});
