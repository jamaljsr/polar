import { info } from 'electron-log';
import { thunk } from 'easy-peasy';
import { RootModel } from 'store/models';
import { findNode, validateNetworkId, validateRequired } from 'store/models/mcp/helpers';
import { McpToolDefinition } from 'store/models/mcp/types';
import { StoreInjections } from 'types';

/** The arguments for the close_tap_channel tool */
export interface CloseTapChannelArgs {
  networkId: number;
  nodeName: string;
  channelPoint: string;
}

/** The result of the close_tap_channel tool */
export interface CloseTapChannelResult {
  success: boolean;
  message: string;
  networkId: number;
  nodeName: string;
  channelPoint: string;
}

/** The definition of the close_tap_channel tool which will be provided to the LLM */
export const closeTapChannelDefinition: McpToolDefinition = {
  name: 'close_tap_channel',
  description:
    'Close a Taproot Asset-enabled Lightning Network channel in a Polar network. ' +
    'This cooperatively closes the specified asset-enabled channel and returns the ' +
    'locked Taproot Assets to the on-chain wallet. Works with litd nodes only.',
  inputSchema: {
    type: 'object',
    properties: {
      networkId: {
        type: 'number',
        description: 'ID of the network',
      },
      nodeName: {
        type: 'string',
        description: 'Name of the litd node that has the channel',
      },
      channelPoint: {
        type: 'string',
        description:
          'Channel point identifier in the format "txid:output_index" (e.g., "abc123...def:0")',
      },
    },
    required: ['networkId', 'nodeName', 'channelPoint'],
  },
};

/** The implementation for the close_tap_channel tool */
export const closeTapChannelTool = thunk<
  Record<string, never>,
  CloseTapChannelArgs,
  StoreInjections,
  RootModel,
  Promise<CloseTapChannelResult>
>(async (actions, args, { getStoreState, getStoreActions }) => {
  // Validate required parameters
  validateNetworkId(args.networkId);
  validateRequired(args.nodeName, 'Node name');
  validateRequired(args.channelPoint, 'Channel point');

  info('MCP: Closing Tap channel:', args);

  // Find the network (networkById throws if not found)
  const network = getStoreState().network.networkById(args.networkId);

  // Find the Lightning node (must be litd for asset channels)
  const node = findNode(network, args.nodeName, 'lightning');

  // Close the channel using the lightning store action (same as regular channel close)
  await getStoreActions().lightning.closeChannel({
    node,
    channelPoint: args.channelPoint,
  });

  return {
    success: true,
    message: `Closed Tap channel "${args.channelPoint}" on node "${args.nodeName}"`,
    networkId: args.networkId,
    nodeName: args.nodeName,
    channelPoint: args.channelPoint,
  };
});
