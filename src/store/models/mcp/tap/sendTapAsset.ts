import { info } from 'electron-log';
import { thunk } from 'easy-peasy';
import { RootModel } from 'store/models';
import { validateNetworkId, validateRequired } from 'store/models/mcp/helpers';
import { McpToolDefinition } from 'store/models/mcp/types';
import { StoreInjections } from 'types';
import { findNode } from '../helpers';

/** The arguments for the send_tap_asset tool */
export interface SendTapAssetArgs {
  networkId: number;
  fromNode: string;
  address: string;
  autoFund?: boolean;
}

/** The result of the send_tap_asset tool */
export interface SendTapAssetResult {
  success: boolean;
  message: string;
  networkId: number;
  fromNode: string;
  address: string;
  transfer: any;
}

/** The definition of the send_tap_asset tool which will be provided to the LLM */
export const sendTapAssetDefinition: McpToolDefinition = {
  name: 'send_tap_asset',
  description:
    'Send a Taproot Asset from a tapd or litd node to a given address. ' +
    'Set autoFund=true to automatically fund the node with Bitcoin if needed. ' +
    'Works with tapd nodes and litd nodes (which include integrated tapd).',
  inputSchema: {
    type: 'object',
    properties: {
      networkId: {
        type: 'number',
        description: 'ID of the network',
      },
      fromNode: {
        type: 'string',
        description: 'Name of the tapd or litd node to send the asset from',
      },
      address: {
        type: 'string',
        description: 'The Taproot Asset address to send to',
      },
      autoFund: {
        type: 'boolean',
        description: 'Whether to automatically fund the LND node with Bitcoin if needed',
      },
    },
    required: ['networkId', 'fromNode', 'address'],
  },
};

/** The implementation for the send_tap_asset tool */
export const sendTapAssetTool = thunk<
  Record<string, never>,
  SendTapAssetArgs,
  StoreInjections,
  RootModel,
  Promise<SendTapAssetResult>
>(
  async (
    actions,
    args,
    { getStoreState, getStoreActions },
  ): Promise<SendTapAssetResult> => {
    // Validate required parameters
    validateNetworkId(args.networkId);
    validateRequired(args.fromNode, 'From node name');
    validateRequired(args.address, 'Address');

    info('MCP: Sending Taproot Asset:', args);

    // Find the network (networkById throws if not found)
    const network = getStoreState().network.networkById(args.networkId);

    // Find the tap node (can be tapd or litd)
    const node = findNode(network, args.fromNode, 'tap');

    // Send the asset
    const result = await getStoreActions().tap.sendAsset({
      node: node,
      address: args.address,
      autoFund: args.autoFund ?? true,
    });

    return {
      success: true,
      message: `Sent Taproot Asset to address ${args.address} from node "${args.fromNode}"`,
      networkId: args.networkId,
      fromNode: args.fromNode,
      address: args.address,
      transfer: result,
    };
  },
);
