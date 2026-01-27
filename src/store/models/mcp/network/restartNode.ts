import { info } from 'electron-log';
import { thunk } from 'easy-peasy';
import { Status } from 'shared/types';
import { RootModel } from 'store/models';
import { findNode, validateNetworkId, validateRequired } from 'store/models/mcp/helpers';
import { McpToolDefinition } from 'store/models/mcp/types';
import { StoreInjections } from 'types';

/** The arguments for the restart_node tool */
export interface RestartNodeArgs {
  networkId: number;
  nodeName: string;
}

/** The result of the restart_node tool */
export interface RestartNodeResult {
  success: boolean;
  message: string;
  networkId: number;
  nodeName: string;
  nodeStatus: Status;
}

/** The definition of the restart_node tool which will be provided to the LLM */
export const restartNodeDefinition: McpToolDefinition = {
  name: 'restart_node',
  description:
    'Restarts a specific node in a Polar network. The node must be in Started or Error state. ' +
    'This operation stops the node first, then starts it again. ' +
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
        description: 'Name of the node to restart',
      },
    },
    required: ['networkId', 'nodeName'],
  },
};

/** The implementation for the restart_node tool */
export const restartNodeTool = thunk<
  Record<string, never>,
  RestartNodeArgs,
  StoreInjections,
  RootModel,
  Promise<RestartNodeResult>
>(
  async (
    actions,
    args,
    { getStoreState, getStoreActions },
  ): Promise<RestartNodeResult> => {
    // Validate required parameters
    validateNetworkId(args.networkId);
    validateRequired(args.nodeName, 'Node name');

    info('MCP: Restarting node:', args);

    // Find the network (networkById throws if not found)
    const network = getStoreState().network.networkById(args.networkId);

    // Find the node by name in any node type (bitcoin, lightning, tap)
    const node = findNode(network, args.nodeName);

    // Check if node can be restarted
    if (node.status !== Status.Started && node.status !== Status.Error) {
      throw new Error(
        `Cannot restart node "${args.nodeName}". Node is currently ${
          Status[node.status]
        }. ` + 'Only Started or Error nodes can be restarted.',
      );
    }

    // Stop the node first
    await getStoreActions().network.toggleNode(node);

    // Small delay to ensure clean shutdown
    await new Promise(resolve => setTimeout(resolve, 100));

    // Get the updated node status after stopping
    const stoppedNetwork = getStoreState().network.networkById(args.networkId);
    const stoppedNode = findNode(stoppedNetwork, args.nodeName);

    // Start the node again
    await getStoreActions().network.toggleNode(stoppedNode);

    // Get the updated node status
    const updatedNetwork = getStoreState().network.networkById(args.networkId);
    const updatedNode = findNode(updatedNetwork, args.nodeName);

    return {
      success: true,
      message: `Node "${args.nodeName}" restarted successfully`,
      networkId: args.networkId,
      nodeName: args.nodeName,
      nodeStatus: updatedNode.status,
    };
  },
);
