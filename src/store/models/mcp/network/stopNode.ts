import { info } from 'electron-log';
import { thunk } from 'easy-peasy';
import { Status } from 'shared/types';
import { RootModel } from 'store/models';
import { findNode, validateNetworkId, validateRequired } from 'store/models/mcp/helpers';
import { McpToolDefinition } from 'store/models/mcp/types';
import { StoreInjections } from 'types';

/** The arguments for the stop_node tool */
export interface StopNodeArgs {
  networkId: number;
  nodeName: string;
}

/** The result of the stop_node tool */
export interface StopNodeResult {
  success: boolean;
  message: string;
  networkId: number;
  nodeName: string;
  nodeStatus: Status;
}

/** The definition of the stop_node tool which will be provided to the LLM */
export const stopNodeDefinition: McpToolDefinition = {
  name: 'stop_node',
  description:
    'Stops a specific node in a Polar network. The node must be in Started state. ' +
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
        description: 'Name of the node to stop',
      },
    },
    required: ['networkId', 'nodeName'],
  },
};

/** The implementation for the stop_node tool */
export const stopNodeTool = thunk<
  Record<string, never>,
  StopNodeArgs,
  StoreInjections,
  RootModel,
  Promise<StopNodeResult>
>(async (actions, args, { getStoreState, getStoreActions }): Promise<StopNodeResult> => {
  // Validate required parameters
  validateNetworkId(args.networkId);
  validateRequired(args.nodeName, 'Node name');

  info('MCP: Stopping node:', args);

  // Find the network (networkById throws if not found)
  const network = getStoreState().network.networkById(args.networkId);

  // Find the node by name in any node type (bitcoin, lightning, tap)
  const node = findNode(network, args.nodeName);

  // Check if node can be stopped
  if (node.status !== Status.Started) {
    throw new Error(
      `Cannot stop node "${args.nodeName}". Node is currently ${Status[node.status]}. ` +
        'Only Started nodes can be stopped.',
    );
  }

  // Stop the node using toggleNode
  await getStoreActions().network.toggleNode(node);

  // Get the updated node status
  const updatedNetwork = getStoreState().network.networkById(args.networkId);
  const updatedNode = findNode(updatedNetwork, args.nodeName);

  return {
    success: true,
    message: `Node "${args.nodeName}" stopped successfully`,
    networkId: args.networkId,
    nodeName: args.nodeName,
    nodeStatus: updatedNode.status,
  };
});
