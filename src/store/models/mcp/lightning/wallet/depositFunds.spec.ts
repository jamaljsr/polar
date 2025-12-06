import { createStore } from 'easy-peasy';
import { Status } from 'shared/types';
import { createMockRootModel, getNetwork, injections } from 'utils/tests';
import { DepositFundsArgs, depositFundsDefinition } from './depositFunds';

jest.mock('electron-log');

describe('depositFunds Tool', () => {
  const rootModel = createMockRootModel();

  // initialize store for type inference
  let store = createStore(rootModel, { injections });

  beforeEach(() => {
    // reset the store before each test run
    store = createStore(rootModel, { injections });
  });

  describe('depositFundsDefinition', () => {
    it('should have correct name', () => {
      expect(depositFundsDefinition.name).toBe('deposit_funds');
    });

    it('should have a description', () => {
      expect(depositFundsDefinition.description).toBeTruthy();
      expect(depositFundsDefinition.description).toContain('Deposit Bitcoin');
    });

    it('should have input schema with required fields', () => {
      expect(depositFundsDefinition.inputSchema.type).toBe('object');
      expect(depositFundsDefinition.inputSchema.properties).toHaveProperty('networkId');
      expect(depositFundsDefinition.inputSchema.properties).toHaveProperty('nodeName');
      expect(depositFundsDefinition.inputSchema.properties).toHaveProperty('sats');
      expect(depositFundsDefinition.inputSchema.required).toEqual([
        'networkId',
        'nodeName',
        'sats',
      ]);
    });

    it('should specify sats minimum value', () => {
      expect(depositFundsDefinition.inputSchema.properties.sats.minimum).toBe(1);
    });
  });

  describe('depositFundsTool', () => {
    it('should deposit funds successfully', async () => {
      const network = getNetwork();
      network.nodes.lightning[0].status = Status.Started;
      store.getActions().network.setNetworks([network]);

      const spy = jest
        .spyOn(store.getActions().lightning, 'depositFunds')
        .mockImplementation(() => Promise.resolve());

      const args: DepositFundsArgs = {
        networkId: network.id,
        nodeName: 'alice',
        sats: 50000,
      };

      const result = await store.getActions().mcp.depositFunds(args);

      expect(result.success).toBe(true);
      expect(result.message).toContain('Deposited 50000 sats');
      expect(result.networkId).toBe(network.id);
      expect(result.nodeName).toBe('alice');
      expect(result.sats).toBe(50000);
      expect(spy).toHaveBeenCalledWith({
        node: expect.objectContaining({ name: 'alice' }),
        sats: '50000',
      });
    });

    it('should throw error if networkId is missing', async () => {
      const args = {
        nodeName: 'alice',
        sats: 50000,
      } as any;

      await expect(store.getActions().mcp.depositFunds(args)).rejects.toThrow(
        'Network ID is required',
      );
    });

    it('should throw error if nodeName is missing', async () => {
      const args = {
        networkId: 1,
        sats: 50000,
      } as any;

      await expect(store.getActions().mcp.depositFunds(args)).rejects.toThrow(
        'Node name is required',
      );
    });

    it('should throw error if sats is missing', async () => {
      const network = getNetwork();
      store.getActions().network.setNetworks([network]);

      const args = {
        networkId: network.id,
        nodeName: 'alice',
      } as any;

      await expect(store.getActions().mcp.depositFunds(args)).rejects.toThrow(
        'Amount in sats must be greater than 0',
      );
    });

    it('should throw error if sats is zero', async () => {
      const network = getNetwork();
      store.getActions().network.setNetworks([network]);

      const args: DepositFundsArgs = {
        networkId: network.id,
        nodeName: 'alice',
        sats: 0,
      };

      await expect(store.getActions().mcp.depositFunds(args)).rejects.toThrow(
        'Amount in sats must be greater than 0',
      );
    });

    it('should throw error if sats is negative', async () => {
      const network = getNetwork();
      store.getActions().network.setNetworks([network]);

      const args: DepositFundsArgs = {
        networkId: network.id,
        nodeName: 'alice',
        sats: -100,
      };

      await expect(store.getActions().mcp.depositFunds(args)).rejects.toThrow(
        'Amount in sats must be greater than 0',
      );
    });

    it('should throw error if network not found', async () => {
      const network = getNetwork();
      store.getActions().network.setNetworks([network]);

      const args: DepositFundsArgs = {
        networkId: 99999,
        nodeName: 'alice',
        sats: 50000,
      };

      await expect(store.getActions().mcp.depositFunds(args)).rejects.toThrow(
        "Network with the id '99999' was not found.",
      );
    });

    it('should throw error if node not found', async () => {
      const network = getNetwork();
      store.getActions().network.setNetworks([network]);

      const args: DepositFundsArgs = {
        networkId: network.id,
        nodeName: 'nonexistent',
        sats: 50000,
      };

      await expect(store.getActions().mcp.depositFunds(args)).rejects.toThrow(
        'Lightning node "nonexistent" not found in network',
      );
    });

    it('should handle depositFunds failure', async () => {
      const network = getNetwork();
      store.getActions().network.setNetworks([network]);

      jest
        .spyOn(store.getActions().lightning, 'depositFunds')
        .mockRejectedValue(new Error('Failed to deposit funds'));

      const args: DepositFundsArgs = {
        networkId: network.id,
        nodeName: 'alice',
        sats: 50000,
      };

      await expect(store.getActions().mcp.depositFunds(args)).rejects.toThrow(
        'Failed to deposit funds',
      );
    });

    it('should deposit different amounts correctly', async () => {
      const network = getNetwork();
      store.getActions().network.setNetworks([network]);

      const spy = jest
        .spyOn(store.getActions().lightning, 'depositFunds')
        .mockImplementation(() => Promise.resolve());

      const testAmounts = [1, 1000, 100000, 1000000];

      for (const amount of testAmounts) {
        const args: DepositFundsArgs = {
          networkId: network.id,
          nodeName: 'alice',
          sats: amount,
        };

        const result = await store.getActions().mcp.depositFunds(args);

        expect(result.success).toBe(true);
        expect(result.sats).toBe(amount);
        expect(spy).toHaveBeenCalledWith({
          node: expect.objectContaining({ name: 'alice' }),
          sats: amount.toString(),
        });
      }
    });

    it('should work with different Lightning node types', async () => {
      const network = getNetwork();
      store.getActions().network.setNetworks([network]);

      const spy = jest
        .spyOn(store.getActions().lightning, 'depositFunds')
        .mockImplementation(() => Promise.resolve());

      const testNodes = ['alice', 'bob', 'carol'];

      for (const nodeName of testNodes) {
        const args: DepositFundsArgs = {
          networkId: network.id,
          nodeName,
          sats: 50000,
        };

        const result = await store.getActions().mcp.depositFunds(args);

        expect(result.success).toBe(true);
        expect(result.nodeName).toBe(nodeName);
        expect(spy).toHaveBeenCalledWith({
          node: expect.objectContaining({ name: nodeName }),
          sats: '50000',
        });
      }
    });
  });
});
