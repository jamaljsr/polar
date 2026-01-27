import { info } from 'electron-log';
import { thunk } from 'easy-peasy';
import { RootModel } from 'store/models';
import { McpToolDefinition } from 'store/models/mcp/types';
import { StoreInjections } from 'types';
import { validateNetworkId, validateRequired } from 'store/models/mcp/helpers';
import { findNode } from '../helpers';

/** The arguments for the list_tap_assets tool */
export interface ListTapAssetsArgs {
  networkId: number;
  nodeName: string;
}

/** A Taproot Asset item in the list */
export interface TapAssetItem {
  id: string;
  name: string;
  type: string;
  amount: string;
  genesisPoint: string;
  anchorOutpoint: string;
  groupKey: string;
  decimals: number;
  nodeName: string;
}

/** The result of the list_tap_assets tool */
export interface ListTapAssetsResult {
  networkId: number;
  assets: TapAssetItem[];
  totalCount: number;
}

/** The definition of the list_tap_assets tool which will be provided to the LLM */
export const listTapAssetsDefinition: McpToolDefinition = {
  name: 'list_tap_assets',
  description:
    'List all Taproot Assets for a specific tapd or litd node. ' +
    'Returns asset details including ID, name, type, amount, genesis point, and decimals. ' +
    'Works with tapd nodes and litd nodes (which include integrated tapd).',
  inputSchema: {
    type: 'object',
    properties: {
      networkId: {
        type: 'number',
        description: 'ID of the network',
      },
      nodeName: {
        type: 'string',
        description: 'Name of the tapd or litd node to list assets from',
      },
    },
    required: ['networkId', 'nodeName'],
  },
};

/** The implementation for the list_tap_assets tool */
export const listTapAssetsTool = thunk<
  Record<string, never>,
  ListTapAssetsArgs,
  StoreInjections,
  RootModel,
  Promise<ListTapAssetsResult>
>(
  async (
    actions,
    args,
    { getStoreState, getStoreActions },
  ): Promise<ListTapAssetsResult> => {
    // Validate required parameters
    validateNetworkId(args.networkId);
    validateRequired(args.nodeName, 'Node name');

    info('MCP: Listing Taproot Assets:', args);

    // Find the network (networkById throws if not found)
    const network = getStoreState().network.networkById(args.networkId);

    // Find the tap node (can be tapd or litd)
    const node = findNode(network, args.nodeName, 'tap');

    // Get assets for this node
    await getStoreActions().tap.getAssets(node);

    // Retrieve assets from state
    const tapState = getStoreState().tap;
    const nodeAssets = tapState.nodes[node.name]?.assets || [];
    const assets = nodeAssets.map(asset => ({
      id: asset.id,
      name: asset.name,
      type: asset.type,
      amount: asset.amount,
      genesisPoint: asset.genesisPoint,
      anchorOutpoint: asset.anchorOutpoint,
      groupKey: asset.groupKey,
      decimals: asset.decimals,
      nodeName: node.name,
    }));

    return {
      networkId: args.networkId,
      assets,
      totalCount: assets.length,
    };
  },
);
