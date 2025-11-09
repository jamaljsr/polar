import { info } from 'electron-log';
import { thunk } from 'easy-peasy';
import { RootModel } from 'store/models';
import {
  validateNetworkId,
  validatePositiveNumber,
  validateRequired,
} from 'store/models/mcp/helpers';
import { McpToolDefinition } from 'store/models/mcp/types';
import { StoreInjections } from 'types';
import { findNode } from '../../helpers';

/** The arguments for the fund_tap_channel tool */
export interface FundTapChannelArgs {
  networkId: number;
  fromNode: string;
  toNode: string;
  assetId: string;
  amount: number;
}

/** The result of the fund_tap_channel tool */
export interface FundTapChannelResult {
  success: boolean;
  message: string;
  networkId: number;
  fromNode: string;
  toNode: string;
  assetId: string;
  amount: number;
}

/** The definition of the fund_tap_channel tool which will be provided to the LLM */
export const fundTapChannelDefinition: McpToolDefinition = {
  name: 'fund_tap_channel',
  description:
    'Fund a Lightning Network channel with Taproot Assets between two litd nodes. ' +
    'This creates an asset-enabled payment channel using the specified asset as collateral. ' +
    'The asset must exist on the source node and will be locked in the channel. ' +
    'Works with litd nodes only (which include integrated LND + tapd).',
  inputSchema: {
    type: 'object',
    properties: {
      networkId: {
        type: 'number',
        description: 'ID of the network',
      },
      fromNode: {
        type: 'string',
        description: 'Name of the source litd node (the one holding the asset)',
      },
      toNode: {
        type: 'string',
        description: 'Name of the destination litd node',
      },
      assetId: {
        type: 'string',
        description: 'Asset ID of the Taproot Asset to use for funding',
      },
      amount: {
        type: 'number',
        description: 'Amount of the asset to fund the channel with',
        minimum: 1,
      },
    },
    required: ['networkId', 'fromNode', 'toNode', 'assetId', 'amount'],
  },
};

/** The implementation for the fund_tap_channel tool */
export const fundTapChannelTool = thunk<
  Record<string, never>,
  FundTapChannelArgs,
  StoreInjections,
  RootModel,
  Promise<FundTapChannelResult>
>(
  async (
    actions,
    args,
    { getStoreState, getStoreActions },
  ): Promise<FundTapChannelResult> => {
    // Validate required parameters
    validateNetworkId(args.networkId);
    validateRequired(args.fromNode, 'From node name');
    validateRequired(args.toNode, 'To node name');
    validateRequired(args.assetId, 'Asset ID');
    validatePositiveNumber(args.amount, 'Amount');

    info('MCP: Funding Tap channel:', args);

    // Find the network (networkById throws if not found)
    const network = getStoreState().network.networkById(args.networkId);

    // Find the tap node (can be tapd or litd)
    const fromNode = findNode(network, args.fromNode, 'tap');

    // Find the to node
    const toNode = findNode(network, args.toNode, 'lightning');

    // Ensure nodes are different
    if (fromNode.name === toNode.name) {
      throw new Error('Cannot fund channel between the same node');
    }

    // Fund the channel using the tap store action
    await getStoreActions().tap.fundChannel({
      from: fromNode,
      to: toNode,
      assetId: args.assetId,
      amount: args.amount,
    });

    return {
      success: true,
      message: `Funded Tap channel from "${args.fromNode}" to "${args.toNode}" with ${args.amount} units of asset ${args.assetId}`,
      networkId: args.networkId,
      fromNode: args.fromNode,
      toNode: args.toNode,
      assetId: args.assetId,
      amount: args.amount,
    };
  },
);
