import { info } from 'electron-log';
import { thunk } from 'easy-peasy';
import { RootModel } from 'store/models';
import { findNode, validateNetworkId, validateRequired } from 'store/models/mcp/helpers';
import { McpToolDefinition } from 'store/models/mcp/types';
import { StoreInjections } from 'types';

/** The arguments for the pay_asset_invoice tool */
export interface PayAssetInvoiceArgs {
  networkId: number;
  fromNode: string;
  assetId: string;
  invoice: string;
}

/** The result of the pay_asset_invoice tool */
export interface PayAssetInvoiceResult {
  success: boolean;
  message: string;
  networkId: number;
  fromNode: string;
  assetId: string;
  invoice: string;
  receipt: {
    preimage: string;
    amount: number;
    destination: string;
  };
}

/** The definition of the pay_asset_invoice tool which will be provided to the LLM */
export const payAssetInvoiceDefinition: McpToolDefinition = {
  name: 'pay_asset_invoice',
  description:
    'Pay a Lightning invoice using Taproot Assets from a litd node. ' +
    'The node must have sufficient assets in channels to pay the invoice. ' +
    'Works only with litd nodes (which include integrated LND + Lightning Terminal + tapd).',
  inputSchema: {
    type: 'object',
    properties: {
      networkId: {
        type: 'number',
        description: 'ID of the network',
      },
      fromNode: {
        type: 'string',
        description: 'Name of the litd node to pay the invoice from',
      },
      assetId: {
        type: 'string',
        description: 'ID of the Taproot Asset to use for payment',
      },
      invoice: {
        type: 'string',
        description: 'The Lightning invoice string to pay',
      },
    },
    required: ['networkId', 'fromNode', 'assetId', 'invoice'],
  },
};

/** The implementation for the pay_asset_invoice tool */
export const payAssetInvoiceTool = thunk<
  Record<string, never>,
  PayAssetInvoiceArgs,
  StoreInjections,
  RootModel,
  Promise<PayAssetInvoiceResult>
>(
  async (
    actions,
    args,
    { getStoreState, getStoreActions },
  ): Promise<PayAssetInvoiceResult> => {
    // Validate required parameters
    validateNetworkId(args.networkId);
    validateRequired(args.fromNode, 'From node name');
    validateRequired(args.assetId, 'Asset ID');
    validateRequired(args.invoice, 'Invoice');

    info('MCP: Paying asset invoice:', args);

    // Find the network (networkById throws if not found)
    const network = getStoreState().network.networkById(args.networkId);

    // Find the litd node
    const node = findNode(network, args.fromNode, 'litd');

    // Pay the asset invoice
    const receipt = await getStoreActions().lit.payAssetInvoice({
      node: node,
      assetId: args.assetId,
      invoice: args.invoice,
    });

    return {
      success: true,
      message: `Paid asset invoice using asset ${args.assetId} from node "${args.fromNode}"`,
      networkId: args.networkId,
      fromNode: args.fromNode,
      assetId: args.assetId,
      invoice: args.invoice,
      receipt,
    };
  },
);
