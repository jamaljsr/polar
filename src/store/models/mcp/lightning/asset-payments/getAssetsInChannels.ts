import { info } from 'electron-log';
import { thunk } from 'easy-peasy';
import { RootModel } from 'store/models';
import { findNode, validateNetworkId, validateRequired } from 'store/models/mcp/helpers';
import { McpToolDefinition } from 'store/models/mcp/types';
import { StoreInjections } from 'types';

/** Asset information returned by get_assets_in_channels */
export interface AssetInChannel {
  asset: {
    id: string;
    name: string;
    groupKey?: string;
    capacity: string;
    localBalance: string;
    remoteBalance: string;
    decimals: number;
  };
  peerPubkey: string;
}

/** The arguments for the get_assets_in_channels tool */
export interface GetAssetsInChannelsArgs {
  networkId: number;
  nodeName: string;
}

/** The result of the get_assets_in_channels tool */
export interface GetAssetsInChannelsResult {
  success: boolean;
  message: string;
  networkId: number;
  nodeName: string;
  assetsInChannels: AssetInChannel[];
}

/** The definition of the get_assets_in_channels tool which will be provided to the LLM */
export const getAssetsInChannelsDefinition: McpToolDefinition = {
  name: 'get_assets_in_channels',
  description:
    'Get all Taproot Assets available in Lightning channels for a litd node. ' +
    'Returns assets with their balances and peer information. ' +
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
        description: 'Name of the litd node to get assets in channels for',
      },
    },
    required: ['networkId', 'nodeName'],
  },
};

/** The implementation for the get_assets_in_channels tool */
export const getAssetsInChannelsTool = thunk<
  Record<string, never>,
  GetAssetsInChannelsArgs,
  StoreInjections,
  RootModel,
  Promise<GetAssetsInChannelsResult>
>(
  async (
    actions,
    args,
    { getStoreState, getStoreActions },
  ): Promise<GetAssetsInChannelsResult> => {
    // Validate required parameters
    validateNetworkId(args.networkId);
    validateRequired(args.nodeName, 'Node name');

    info('MCP: Getting assets in channels:', args);

    // Find the network (networkById throws if not found)
    const network = getStoreState().network.networkById(args.networkId);

    // Find the litd node
    const node = findNode(network, args.nodeName, 'litd');

    // Get assets in channels
    const assetsInChannels = await getStoreActions().lit.getAssetsInChannels({
      nodeName: node.name,
    });

    return {
      success: true,
      message: `Retrieved ${assetsInChannels.length} assets in channels for node "${args.nodeName}"`,
      networkId: args.networkId,
      nodeName: args.nodeName,
      assetsInChannels,
    };
  },
);
