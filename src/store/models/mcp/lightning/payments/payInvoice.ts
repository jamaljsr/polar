import { info } from 'electron-log';
import { thunk } from 'easy-peasy';
import { RootModel } from 'store/models';
import { findNode, validateNetworkId, validateRequired } from 'store/models/mcp/helpers';
import { McpToolDefinition } from 'store/models/mcp/types';
import { StoreInjections } from 'types';

/** The arguments for the pay_invoice tool */
export interface PayInvoiceArgs {
  networkId: number;
  fromNode: string;
  invoice: string;
  amount?: number;
}

/** The result of the pay_invoice tool */
export interface PayInvoiceResult {
  success: boolean;
  message: string;
  networkId: number;
  fromNode: string;
  invoice: string;
  amount?: number;
  preimage: string;
  destination: string;
}

/** The definition of the pay_invoice tool which will be provided to the LLM */
export const payInvoiceDefinition: McpToolDefinition = {
  name: 'pay_invoice',
  description:
    'Pay a Lightning Network payment invoice from a specific node. ' +
    'The invoice is a BOLT11 payment request string. ' +
    'An optional amount can be provided for invoices without a specific amount. ' +
    'Returns a payment receipt with the preimage and fees paid. ' +
    'Works with LND, c-lightning, eclair, and litd nodes.',
  inputSchema: {
    type: 'object',
    properties: {
      networkId: {
        type: 'number',
        description: 'ID of the network',
      },
      fromNode: {
        type: 'string',
        description: 'Name of the Lightning node to pay the invoice from',
      },
      invoice: {
        type: 'string',
        description: 'The BOLT11 payment request string to pay',
      },
      amount: {
        type: 'number',
        description:
          'Optional amount in satoshis to pay for an invoice without a specified amount',
        minimum: 1,
      },
    },
    required: ['networkId', 'fromNode', 'invoice'],
  },
};

/** The implementation for the pay_invoice tool */
export const payInvoiceTool = thunk<
  Record<string, never>,
  PayInvoiceArgs,
  StoreInjections,
  RootModel,
  Promise<PayInvoiceResult>
>(
  async (
    actions,
    args,
    { getStoreState, getStoreActions },
  ): Promise<PayInvoiceResult> => {
    // Validate required parameters
    validateNetworkId(args.networkId);
    validateRequired(args.fromNode, 'fromNode name');
    validateRequired(args.invoice, 'Invoice');

    info('MCP: Paying invoice:', args);

    // Find the network (networkById throws if not found)
    const network = getStoreState().network.networkById(args.networkId);

    // Find the Lightning node
    const node = findNode(network, args.fromNode, 'lightning');

    // Pay the invoice
    const result = await getStoreActions().lightning.payInvoice({
      node,
      invoice: args.invoice,
      amount: args.amount,
    });

    return {
      success: true,
      message: `Paid invoice from node "${args.fromNode}"`,
      networkId: args.networkId,
      fromNode: args.fromNode,
      invoice: args.invoice,
      amount: args.amount,
      preimage: result.preimage,
      destination: result.destination,
    };
  },
);
