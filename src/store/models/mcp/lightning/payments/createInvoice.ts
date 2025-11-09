import { info } from 'electron-log';
import { thunk } from 'easy-peasy';
import { RootModel } from 'store/models';
import {
  findNode,
  validateNetworkId,
  validateRequired,
  validatePositiveNumber,
} from 'store/models/mcp/helpers';
import { McpToolDefinition } from 'store/models/mcp/types';
import { StoreInjections } from 'types';

/** The arguments for the create_invoice tool */
export interface CreateInvoiceArgs {
  networkId: number;
  nodeName: string;
  amount: number;
  memo?: string;
}

/** The result of the create_invoice tool */
export interface CreateInvoiceResult {
  success: boolean;
  message: string;
  networkId: number;
  nodeName: string;
  amount: number;
  memo?: string;
  invoice: string;
}

/** The definition of the create_invoice tool which will be provided to the LLM */
export const createInvoiceDefinition: McpToolDefinition = {
  name: 'create_invoice',
  description:
    'Create a Lightning Network payment invoice for a node. ' +
    'Generates a payment request string (BOLT11 invoice) that can be paid by other Lightning nodes. ' +
    'The invoice contains the payment amount and an optional memo. ' +
    'Returns the payment request string that can be used with pay_invoice. ' +
    'Works with LND, c-lightning, eclair, and litd nodes.',
  inputSchema: {
    type: 'object',
    properties: {
      networkId: {
        type: 'number',
        description: 'ID of the network',
      },
      nodeName: {
        type: 'string',
        description: 'Name of the Lightning node to create invoice on',
      },
      amount: {
        type: 'number',
        description: 'Amount in satoshis for the invoice',
        minimum: 1,
      },
      memo: {
        type: 'string',
        description: 'Optional description/memo for the invoice',
      },
    },
    required: ['networkId', 'nodeName', 'amount'],
  },
};

/** The implementation for the create_invoice tool */
export const createInvoiceTool = thunk<
  Record<string, never>,
  CreateInvoiceArgs,
  StoreInjections,
  RootModel,
  Promise<CreateInvoiceResult>
>(
  async (
    actions,
    args,
    { getStoreState, getStoreActions },
  ): Promise<CreateInvoiceResult> => {
    // Validate required parameters
    validateNetworkId(args.networkId);
    validateRequired(args.nodeName, 'Node name');
    validatePositiveNumber(args.amount, 'Amount');

    info('MCP: Creating invoice:', args);

    // Find the network (networkById throws if not found)
    const network = getStoreState().network.networkById(args.networkId);

    // Find the Lightning node
    const node = findNode(network, args.nodeName, 'lightning');

    // Create the invoice
    const invoice = await getStoreActions().lightning.createInvoice({
      node,
      amount: args.amount,
      memo: args.memo,
    });

    return {
      success: true,
      message: `Created invoice for ${args.amount} sats on node "${args.nodeName}"`,
      networkId: args.networkId,
      nodeName: args.nodeName,
      amount: args.amount,
      memo: args.memo,
      invoice,
    };
  },
);
