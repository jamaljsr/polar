import { info } from 'electron-log';
import { thunk } from 'easy-peasy';
import { RootModel } from 'store/models';
import {
  findNode,
  validateNetworkId,
  validatePositiveNumber,
  validateRequired,
} from 'store/models/mcp/helpers';
import { McpToolDefinition } from 'store/models/mcp/types';
import { StoreInjections } from 'types';

/** The arguments for the create_asset_invoice tool */
export interface CreateAssetInvoiceArgs {
  networkId: number;
  nodeName: string;
  assetId: string;
  amount: number;
}

/** The result of the create_asset_invoice tool */
export interface CreateAssetInvoiceResult {
  success: boolean;
  message: string;
  networkId: number;
  nodeName: string;
  assetId: string;
  amount: number;
  invoice: string;
  sats: number;
}

/** The definition of the create_asset_invoice tool which will be provided to the LLM */
export const createAssetInvoiceDefinition: McpToolDefinition = {
  name: 'create_asset_invoice',
  description:
    'Create a Lightning invoice payable with Taproot Assets from a litd node. ' +
    'The node must have sufficient assets in channels to create the invoice. ' +
    'Works only with litd nodes (which include integrated LND + Lightning Terminal + tapd).',
  inputSchema: {
    type: 'object',
    properties: {
      networkId: {
        type: 'number',
        description: 'ID of the network',
      },
      nodeName: {
        type: 'string',
        description: 'Name of the litd node to create the invoice from',
      },
      assetId: {
        type: 'string',
        description: 'ID of the Taproot Asset to create invoice for',
      },
      amount: {
        type: 'number',
        description: 'Amount of the asset to invoice for',
      },
    },
    required: ['networkId', 'nodeName', 'assetId', 'amount'],
  },
};

/** The implementation for the create_asset_invoice tool */
export const createAssetInvoiceTool = thunk<
  Record<string, never>,
  CreateAssetInvoiceArgs,
  StoreInjections,
  RootModel,
  Promise<CreateAssetInvoiceResult>
>(
  async (
    actions,
    args,
    { getStoreState, getStoreActions },
  ): Promise<CreateAssetInvoiceResult> => {
    // Validate required parameters
    validateNetworkId(args.networkId);
    validateRequired(args.nodeName, 'Node name');
    validateRequired(args.assetId, 'Asset ID');
    validatePositiveNumber(args.amount, 'Amount');

    info('MCP: Creating asset invoice:', args);

    // Find the network (networkById throws if not found)
    const network = getStoreState().network.networkById(args.networkId);

    // Find the litd node
    const node = findNode(network, args.nodeName, 'litd');

    // Create the asset invoice
    const result = await getStoreActions().lit.createAssetInvoice({
      node: node,
      assetId: args.assetId,
      amount: args.amount,
    });

    return {
      success: true,
      message: `Created asset invoice for ${args.amount} units of asset ${args.assetId} from node "${args.nodeName}"`,
      networkId: args.networkId,
      nodeName: args.nodeName,
      assetId: args.assetId,
      amount: args.amount,
      invoice: result.invoice,
      sats: result.sats,
    };
  },
);
