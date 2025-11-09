import { createStore } from 'easy-peasy';
import { Status } from 'shared/types';
import { createMockRootModel, getNetwork, injections } from 'utils/tests';
import { CreateInvoiceArgs, createInvoiceDefinition } from './createInvoice';

jest.mock('electron-log');

describe('createInvoice Tool', () => {
  const rootModel = createMockRootModel();

  // initialize store for type inference
  let store = createStore(rootModel, { injections });

  beforeEach(() => {
    // reset the store before each test run
    store = createStore(rootModel, { injections });
  });

  describe('createInvoiceDefinition', () => {
    it('should have correct name', () => {
      expect(createInvoiceDefinition.name).toBe('create_invoice');
    });

    it('should have a description', () => {
      expect(createInvoiceDefinition.description).toBeTruthy();
      expect(createInvoiceDefinition.description).toContain(
        'Lightning Network payment invoice',
      );
    });

    it('should have input schema with required fields', () => {
      expect(createInvoiceDefinition.inputSchema.type).toBe('object');
      expect(createInvoiceDefinition.inputSchema.properties).toHaveProperty('networkId');
      expect(createInvoiceDefinition.inputSchema.properties).toHaveProperty('nodeName');
      expect(createInvoiceDefinition.inputSchema.properties).toHaveProperty('amount');
      expect(createInvoiceDefinition.inputSchema.properties).toHaveProperty('memo');
      expect(createInvoiceDefinition.inputSchema.required).toEqual([
        'networkId',
        'nodeName',
        'amount',
      ]);
    });

    it('should specify amount minimum value', () => {
      expect(createInvoiceDefinition.inputSchema.properties.amount.minimum).toBe(1);
    });

    it('should have memo as optional', () => {
      expect(createInvoiceDefinition.inputSchema.required).not.toContain('memo');
    });
  });

  describe('createInvoiceTool', () => {
    it('should create invoice successfully', async () => {
      const network = getNetwork();
      network.nodes.lightning[0].status = Status.Started;
      store.getActions().network.setNetworks([network]);

      const mockInvoice = 'lnbc10u1p3xyzabc...';
      const spy = jest
        .spyOn(store.getActions().lightning, 'createInvoice')
        .mockResolvedValue(mockInvoice);

      const args: CreateInvoiceArgs = {
        networkId: network.id,
        nodeName: 'alice',
        amount: 1000,
      };

      const result = await store.getActions().mcp.createInvoice(args);

      expect(result.success).toBe(true);
      expect(result.message).toContain('Created invoice for 1000 sats');
      expect(result.networkId).toBe(network.id);
      expect(result.nodeName).toBe('alice');
      expect(result.amount).toBe(1000);
      expect(result.invoice).toBe(mockInvoice);
      expect(spy).toHaveBeenCalledWith({
        node: expect.objectContaining({ name: 'alice' }),
        amount: 1000,
        memo: undefined,
      });
    });

    it('should create invoice with memo successfully', async () => {
      const network = getNetwork();
      store.getActions().network.setNetworks([network]);

      const mockInvoice = 'lnbc10u1p3xyzabc...';
      const spy = jest
        .spyOn(store.getActions().lightning, 'createInvoice')
        .mockResolvedValue(mockInvoice);

      const args: CreateInvoiceArgs = {
        networkId: network.id,
        nodeName: 'alice',
        amount: 1000,
        memo: 'Payment for services',
      };

      const result = await store.getActions().mcp.createInvoice(args);

      expect(result.success).toBe(true);
      expect(result.message).toContain('Created invoice for 1000 sats');
      expect(result.networkId).toBe(network.id);
      expect(result.nodeName).toBe('alice');
      expect(result.amount).toBe(1000);
      expect(result.memo).toBe('Payment for services');
      expect(result.invoice).toBe(mockInvoice);
      expect(spy).toHaveBeenCalledWith({
        node: expect.objectContaining({ name: 'alice' }),
        amount: 1000,
        memo: 'Payment for services',
      });
    });

    it('should throw error if networkId is missing', async () => {
      const args = {
        nodeName: 'alice',
        amount: 1000,
      } as any;

      await expect(store.getActions().mcp.createInvoice(args)).rejects.toThrow(
        'Network ID is required',
      );
    });

    it('should throw error if nodeName is missing', async () => {
      const args = {
        networkId: 1,
        amount: 1000,
      } as any;

      await expect(store.getActions().mcp.createInvoice(args)).rejects.toThrow(
        'Node name is required',
      );
    });

    it('should throw error if amount is missing', async () => {
      const network = getNetwork();
      store.getActions().network.setNetworks([network]);

      const args = {
        networkId: network.id,
        nodeName: 'alice',
      } as any;

      await expect(store.getActions().mcp.createInvoice(args)).rejects.toThrow(
        'Amount must be greater than 0',
      );
    });

    it('should throw error if amount is zero', async () => {
      const network = getNetwork();
      store.getActions().network.setNetworks([network]);

      const args: CreateInvoiceArgs = {
        networkId: network.id,
        nodeName: 'alice',
        amount: 0,
      };

      await expect(store.getActions().mcp.createInvoice(args)).rejects.toThrow(
        'Amount must be greater than 0',
      );
    });

    it('should throw error if amount is negative', async () => {
      const network = getNetwork();
      store.getActions().network.setNetworks([network]);

      const args: CreateInvoiceArgs = {
        networkId: network.id,
        nodeName: 'alice',
        amount: -100,
      };

      await expect(store.getActions().mcp.createInvoice(args)).rejects.toThrow(
        'Amount must be greater than 0',
      );
    });

    it('should throw error if network not found', async () => {
      const network = getNetwork();
      store.getActions().network.setNetworks([network]);

      const args: CreateInvoiceArgs = {
        networkId: 99999,
        nodeName: 'alice',
        amount: 1000,
      };

      await expect(store.getActions().mcp.createInvoice(args)).rejects.toThrow(
        "Network with the id '99999' was not found.",
      );
    });

    it('should throw error if node not found', async () => {
      const network = getNetwork();
      store.getActions().network.setNetworks([network]);

      const args: CreateInvoiceArgs = {
        networkId: network.id,
        nodeName: 'nonexistent',
        amount: 1000,
      };

      await expect(store.getActions().mcp.createInvoice(args)).rejects.toThrow(
        'Lightning node "nonexistent" not found in network',
      );
    });

    it('should handle createInvoice failure', async () => {
      const network = getNetwork();
      store.getActions().network.setNetworks([network]);

      jest
        .spyOn(store.getActions().lightning, 'createInvoice')
        .mockRejectedValue(new Error('Failed to create invoice'));

      const args: CreateInvoiceArgs = {
        networkId: network.id,
        nodeName: 'alice',
        amount: 1000,
      };

      await expect(store.getActions().mcp.createInvoice(args)).rejects.toThrow(
        'Failed to create invoice',
      );
    });

    it('should create invoices with different amounts correctly', async () => {
      const network = getNetwork();
      store.getActions().network.setNetworks([network]);

      const mockInvoice = 'lnbc10u1p3xyzabc...';
      const spy = jest
        .spyOn(store.getActions().lightning, 'createInvoice')
        .mockResolvedValue(mockInvoice);

      const testAmounts = [1, 100, 10000, 1000000];

      for (const amount of testAmounts) {
        const args: CreateInvoiceArgs = {
          networkId: network.id,
          nodeName: 'alice',
          amount,
        };

        const result = await store.getActions().mcp.createInvoice(args);

        expect(result.success).toBe(true);
        expect(result.amount).toBe(amount);
        expect(spy).toHaveBeenCalledWith({
          node: expect.objectContaining({ name: 'alice' }),
          amount,
          memo: undefined,
        });
      }
    });

    it('should work with different Lightning node types', async () => {
      const network = getNetwork();
      store.getActions().network.setNetworks([network]);

      const mockInvoice = 'lnbc10u1p3xyzabc...';
      const spy = jest
        .spyOn(store.getActions().lightning, 'createInvoice')
        .mockResolvedValue(mockInvoice);

      const testNodes = ['alice', 'bob', 'carol'];

      for (const nodeName of testNodes) {
        const args: CreateInvoiceArgs = {
          networkId: network.id,
          nodeName,
          amount: 1000,
        };

        const result = await store.getActions().mcp.createInvoice(args);

        expect(result.success).toBe(true);
        expect(result.nodeName).toBe(nodeName);
        expect(spy).toHaveBeenCalledWith({
          node: expect.objectContaining({ name: nodeName }),
          amount: 1000,
          memo: undefined,
        });
      }
    });

    it('should handle empty memo string', async () => {
      const network = getNetwork();
      store.getActions().network.setNetworks([network]);

      const mockInvoice = 'lnbc10u1p3xyzabc...';
      const spy = jest
        .spyOn(store.getActions().lightning, 'createInvoice')
        .mockResolvedValue(mockInvoice);

      const args: CreateInvoiceArgs = {
        networkId: network.id,
        nodeName: 'alice',
        amount: 1000,
        memo: '',
      };

      const result = await store.getActions().mcp.createInvoice(args);

      expect(result.success).toBe(true);
      expect(result.memo).toBe('');
      expect(spy).toHaveBeenCalledWith({
        node: expect.objectContaining({ name: 'alice' }),
        amount: 1000,
        memo: '',
      });
    });

    it('should handle long memo strings', async () => {
      const network = getNetwork();
      store.getActions().network.setNetworks([network]);

      const mockInvoice = 'lnbc10u1p3xyzabc...';
      const spy = jest
        .spyOn(store.getActions().lightning, 'createInvoice')
        .mockResolvedValue(mockInvoice);

      const longMemo = 'A'.repeat(1000);
      const args: CreateInvoiceArgs = {
        networkId: network.id,
        nodeName: 'alice',
        amount: 1000,
        memo: longMemo,
      };

      const result = await store.getActions().mcp.createInvoice(args);

      expect(result.success).toBe(true);
      expect(result.memo).toBe(longMemo);
      expect(spy).toHaveBeenCalledWith({
        node: expect.objectContaining({ name: 'alice' }),
        amount: 1000,
        memo: longMemo,
      });
    });
  });
});
