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

/** The arguments for the open_channel tool */
export interface OpenChannelArgs {
  networkId: number;
  fromNode: string;
  toNode: string;
  sats: number;
  isPrivate?: boolean;
  autoFund?: boolean;
}

/** The result of the open_channel tool */
export interface OpenChannelResult {
  success: boolean;
  message: string;
  networkId: number;
  fromNode: string;
  toNode: string;
  capacity: number;
  channelPoint: string;
}

/** The definition of the open_channel tool which will be provided to the LLM */
export const openChannelDefinition: McpToolDefinition = {
  name: 'open_channel',
  description:
    'Open a Lightning Network channel between two nodes in a Polar network. This creates a ' +
    'payment channel with the specified capacity. You can optionally set the channel as private ' +
    'and auto-fund the source node if it lacks sufficient balance.',
  inputSchema: {
    type: 'object',
    properties: {
      networkId: {
        type: 'number',
        description: 'ID of the network',
      },
      fromNode: {
        type: 'string',
        description: 'Name of the source Lightning node (the one funding the channel)',
      },
      toNode: {
        type: 'string',
        description: 'Name of the destination Lightning node',
      },
      sats: {
        type: 'number',
        description: 'Channel capacity in satoshis',
      },
      isPrivate: {
        type: 'boolean',
        description:
          'Whether the channel should be private (not announced to the network). Default: false',
        default: false,
      },
      autoFund: {
        type: 'boolean',
        description:
          'Automatically deposit funds to the source node if it lacks sufficient balance. Default: true',
        default: true,
      },
    },
    required: ['networkId', 'fromNode', 'toNode', 'sats'],
  },
};

/** The implementation for the open_channel tool */
export const openChannelTool = thunk<
  Record<string, never>,
  OpenChannelArgs,
  StoreInjections,
  RootModel,
  Promise<OpenChannelResult>
>(
  async (
    actions,
    args,
    { getStoreState, getStoreActions },
  ): Promise<OpenChannelResult> => {
    // Validate required parameters
    validateNetworkId(args.networkId);
    validateRequired(args.fromNode, 'From node name');
    validateRequired(args.toNode, 'To node name');
    validatePositiveNumber(args.sats, 'Channel capacity in sats');

    info('MCP: Opening channel:', args);

    // Find the network (networkById throws if not found)
    const network = getStoreState().network.networkById(args.networkId);

    // Find the from (source) and to (destination) Lightning nodes
    const fromNode = findNode(network, args.fromNode, 'lightning');
    const toNode = findNode(network, args.toNode, 'lightning');

    // Ensure nodes are different
    if (fromNode.name === toNode.name) {
      throw new Error('Cannot open channel between the same node');
    }

    // Open the channel using the lightning store action
    const channelPoint = await getStoreActions().lightning.openChannel({
      from: fromNode,
      to: toNode,
      sats: args.sats.toString(),
      autoFund: args.autoFund ?? true,
      isPrivate: args.isPrivate ?? false,
    });

    return {
      success: true,
      message: `Opened channel from "${args.fromNode}" to "${args.toNode}" with capacity ${args.sats} sats`,
      networkId: args.networkId,
      fromNode: args.fromNode,
      toNode: args.toNode,
      capacity: args.sats,
      channelPoint,
    };
  },
);
