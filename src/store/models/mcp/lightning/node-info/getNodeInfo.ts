import { info } from 'electron-log';
import { thunk } from 'easy-peasy';
import { LightningNodeInfo } from 'lib/lightning/types';
import { RootModel } from 'store/models';
import { findNode, validateNetworkId, validateRequired } from 'store/models/mcp/helpers';
import { McpToolDefinition } from 'store/models/mcp/types';
import { StoreInjections } from 'types';

/** The arguments for the get_node_info tool */
export interface GetNodeInfoArgs {
  networkId: number;
  nodeName: string;
}

/** The result of the get_node_info tool */
export interface GetNodeInfoResult {
  success: boolean;
  message: string;
  networkId: number;
  nodeName: string;
  info: LightningNodeInfo;
}

/** The definition of the get_node_info tool which will be provided to the LLM */
export const getNodeInfoDefinition: McpToolDefinition = {
  name: 'get_node_info',
  description:
    'Get information about a Lightning node including its public key, alias, sync status, ' +
    'block height, and channel counts. This provides essential node information for ' +
    'monitoring and debugging Lightning Network operations.',
  inputSchema: {
    type: 'object',
    properties: {
      networkId: {
        type: 'number',
        description: 'ID of the network',
      },
      nodeName: {
        type: 'string',
        description: 'Name of the Lightning node to get info for',
      },
    },
    required: ['networkId', 'nodeName'],
  },
};

/** The implementation for the get_node_info tool */
export const getNodeInfoTool = thunk<
  Record<string, never>,
  GetNodeInfoArgs,
  StoreInjections,
  RootModel,
  Promise<GetNodeInfoResult>
>(
  async (
    actions,
    args,
    { getStoreState, getStoreActions },
  ): Promise<GetNodeInfoResult> => {
    // Validate required parameters
    validateNetworkId(args.networkId);
    validateRequired(args.nodeName, 'Node name');

    info('MCP: Getting node info:', args);

    // Find the network (networkById throws if not found)
    const network = getStoreState().network.networkById(args.networkId);

    // Find the Lightning node
    const node = findNode(network, args.nodeName, 'lightning');

    // Get node info from the lightning service
    await getStoreActions().lightning.getInfo(node);

    // Retrieve info from state
    const lightningState = getStoreState().lightning;
    const nodeState = lightningState.nodes[node.name];
    const nodeInfo = nodeState?.info;

    if (!nodeInfo) {
      throw new Error('Failed to retrieve node info');
    }

    return {
      success: true,
      message: `Retrieved info for node "${args.nodeName}": ${
        nodeInfo.alias
      } (${nodeInfo.pubkey.slice(0, 12)}...)`,
      networkId: args.networkId,
      nodeName: args.nodeName,
      info: nodeInfo,
    };
  },
);
