import { createStore } from 'easy-peasy';
import { Status } from 'shared/types';
import { createMockRootModel, getNetwork, injections } from 'utils/tests';
import { PayInvoiceArgs, payInvoiceDefinition } from './payInvoice';

jest.mock('electron-log');

describe('payInvoice Tool', () => {
  const rootModel = createMockRootModel();
  let store = createStore(rootModel, { injections });

  beforeEach(() => {
    store = createStore(rootModel, { injections });
  });

  describe('payInvoiceDefinition', () => {
    it('should have correct name', () => {
      expect(payInvoiceDefinition.name).toBe('pay_invoice');
    });

    it('should have a description', () => {
      expect(payInvoiceDefinition.description).toBeTruthy();
      expect(payInvoiceDefinition.description).toContain(
        'Pay a Lightning Network payment invoice',
      );
    });

    it('should have input schema with required fields', () => {
      expect(payInvoiceDefinition.inputSchema.type).toBe('object');
      expect(payInvoiceDefinition.inputSchema.properties).toHaveProperty('networkId');
      expect(payInvoiceDefinition.inputSchema.properties).toHaveProperty('fromNode');
      expect(payInvoiceDefinition.inputSchema.properties).toHaveProperty('invoice');
      expect(payInvoiceDefinition.inputSchema.properties).toHaveProperty('amount');
      expect(payInvoiceDefinition.inputSchema.required).toEqual([
        'networkId',
        'fromNode',
        'invoice',
      ]);
    });

    it('should specify amount minimum value', () => {
      expect(payInvoiceDefinition.inputSchema.properties.amount.minimum).toBe(1);
    });

    it('should have amount as optional', () => {
      expect(payInvoiceDefinition.inputSchema.required).not.toContain('amount');
    });
  });

  describe('payInvoiceTool', () => {
    it('should pay invoice successfully', async () => {
      const network = getNetwork();
      network.nodes.lightning[0].status = Status.Started;
      store.getActions().network.setNetworks([network]);

      const mockResponse = {
        preimage: 'preimage',
        amount: 1000,
        destination: 'dest',
      };
      const spy = jest
        .spyOn(store.getActions().lightning, 'payInvoice')
        .mockResolvedValue(mockResponse);

      const args: PayInvoiceArgs = {
        networkId: network.id,
        fromNode: 'alice',
        invoice: 'lnbc10u1p3xyzabc...',
      };

      const result = await store.getActions().mcp.payInvoice(args);

      expect(result.success).toBe(true);
      expect(result.message).toContain('Paid invoice from node "alice"');
      expect(result.networkId).toBe(network.id);
      expect(result.fromNode).toBe('alice');
      expect(result.invoice).toBe('lnbc10u1p3xyzabc...');
      expect(result.preimage).toBe('preimage');
      expect(spy).toHaveBeenCalledWith({
        node: expect.objectContaining({ name: 'alice' }),
        invoice: 'lnbc10u1p3xyzabc...',
        amount: undefined,
      });
    });

    it('should pay invoice with amount successfully', async () => {
      const network = getNetwork();
      store.getActions().network.setNetworks([network]);

      const mockResponse = {
        preimage: 'preimage',
        amount: 2000,
        destination: 'dest',
      };
      const spy = jest
        .spyOn(store.getActions().lightning, 'payInvoice')
        .mockResolvedValue(mockResponse);

      const args: PayInvoiceArgs = {
        networkId: network.id,
        fromNode: 'alice',
        invoice: 'lnbc10u1p3xyzabc...',
        amount: 2000,
      };

      const result = await store.getActions().mcp.payInvoice(args);

      expect(result.success).toBe(true);
      expect(result.preimage).toBe('preimage');
      expect(spy).toHaveBeenCalledWith({
        node: expect.objectContaining({ name: 'alice' }),
        invoice: 'lnbc10u1p3xyzabc...',
        amount: 2000,
      });
    });

    it('should throw error if networkId is missing', async () => {
      const args = {
        fromNode: 'alice',
        invoice: 'lnbc10u1p3xyzabc...',
      } as any;
      await expect(store.getActions().mcp.payInvoice(args)).rejects.toThrow(
        'Network ID is required',
      );
    });

    it('should throw error if fromNode is missing', async () => {
      const args = {
        networkId: 1,
        invoice: 'lnbc10u1p3xyzabc...',
      } as any;
      await expect(store.getActions().mcp.payInvoice(args)).rejects.toThrow(
        'fromNode name is required',
      );
    });

    it('should throw error if invoice is missing', async () => {
      const args = {
        networkId: 1,
        fromNode: 'alice',
      } as any;
      await expect(store.getActions().mcp.payInvoice(args)).rejects.toThrow(
        'Invoice is required',
      );
    });

    it('should throw error if network not found', async () => {
      const network = getNetwork();
      store.getActions().network.setNetworks([network]);
      const args: PayInvoiceArgs = {
        networkId: 999,
        fromNode: 'alice',
        invoice: 'lnbc10u1p3xyzabc...',
      };
      await expect(store.getActions().mcp.payInvoice(args)).rejects.toThrow(
        "Network with the id '999' was not found.",
      );
    });

    it('should throw error if node not found', async () => {
      const network = getNetwork();
      store.getActions().network.setNetworks([network]);
      const args: PayInvoiceArgs = {
        networkId: network.id,
        fromNode: 'nonexistent',
        invoice: 'lnbc10u1p3xyzabc...',
      };
      await expect(store.getActions().mcp.payInvoice(args)).rejects.toThrow(
        'Lightning node "nonexistent" not found in network',
      );
    });

    it('should handle payInvoice failure', async () => {
      const network = getNetwork();
      store.getActions().network.setNetworks([network]);

      jest
        .spyOn(store.getActions().lightning, 'payInvoice')
        .mockRejectedValue(new Error('Payment failed'));

      const args: PayInvoiceArgs = {
        networkId: network.id,
        fromNode: 'alice',
        invoice: 'lnbc10u1p3xyzabc...',
      };
      await expect(store.getActions().mcp.payInvoice(args)).rejects.toThrow(
        'Payment failed',
      );
    });
  });
});
