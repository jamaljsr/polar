import { info } from 'electron-log';
import { thunk } from 'easy-peasy';
import { Status } from 'shared/types';
import { RootModel } from 'store/models';
import { findNode, validateNetworkId, validateRequired } from 'store/models/mcp/helpers';
import { McpToolDefinition } from 'store/models/mcp/types';
import { StoreInjections } from 'types';

/** The arguments for the start_node tool */
export interface StartNodeArgs {
  networkId: number;
  nodeName: string;
}

/** The result of the start_node tool */
export interface StartNodeResult {
  success: boolean;
  message: string;
  networkId: number;
  nodeName: string;
  nodeStatus: Status;
}

/** The definition of the start_node tool which will be provided to the LLM */
export const startNodeDefinition: McpToolDefinition = {
  name: 'start_node',
  description:
    'Starts a specific node in a Polar network. The node must be in Stopped or Error state. ' +
    'Supports Bitcoin Core, Lightning Network, and Taproot Assets daemon nodes.',
  inputSchema: {
    type: 'object',
    properties: {
      networkId: {
        type: 'number',
        description: 'ID of the network containing the node',
      },
      nodeName: {
        type: 'string',
        description: 'Name of the node to start',
      },
    },
    required: ['networkId', 'nodeName'],
  },
};

/** The implementation for the start_node tool */
export const startNodeTool = thunk<
  Record<string, never>,
  StartNodeArgs,
  StoreInjections,
  RootModel,
  Promise<StartNodeResult>
>(async (actions, args, { getStoreState, getStoreActions }): Promise<StartNodeResult> => {
  // Validate required parameters
  validateNetworkId(args.networkId);
  validateRequired(args.nodeName, 'Node name');

  info('MCP: Starting node:', args);

  // Find the network (networkById throws if not found)
  const network = getStoreState().network.networkById(args.networkId);

  // Find the node by name in any node type (bitcoin, lightning, tap)
  const node = findNode(network, args.nodeName);

  // Check if node can be started
  if (node.status !== Status.Stopped && node.status !== Status.Error) {
    throw new Error(
      `Cannot start node "${args.nodeName}". Node is currently ${Status[node.status]}. ` +
        'Only Stopped or Error nodes can be started.',
    );
  }

  // Start the node using toggleNode
  await getStoreActions().network.toggleNode(node);

  // Get the updated node status
  const updatedNetwork = getStoreState().network.networkById(args.networkId);
  const updatedNode = findNode(updatedNetwork, args.nodeName);

  return {
    success: true,
    message: `Node "${args.nodeName}" started successfully`,
    networkId: args.networkId,
    nodeName: args.nodeName,
    nodeStatus: updatedNode.status,
  };
});
