import { info } from 'electron-log';
import { thunk, Thunk } from 'easy-peasy';
import { CommonNode } from 'shared/types';
import { RootModel } from 'store/models';
import { validateNetworkId, validateRequired } from 'store/models/mcp/helpers';
import { McpToolDefinition } from 'store/models/mcp/types';
import { StoreInjections } from 'types';

/** The arguments for the rename_node tool */
export interface RenameNodeArgs {
  networkId: number;
  oldName: string;
  newName: string;
}

/** The result of the rename_node tool */
export interface RenameNodeResult {
  success: boolean;
  message: string;
}

/** The definition of the rename_node tool which will be provided to the LLM */
export const renameNodeDefinition: McpToolDefinition = {
  name: 'rename_node',
  description:
    'Renames a node in an existing Polar network. This will update the node name ' +
    'throughout the system, including Docker containers, configuration files, and UI ' +
    'references. Supports renaming Lightning nodes (LND, c-lightning, eclair, litd), ' +
    'Bitcoin nodes (bitcoind), and Taproot Asset nodes (tapd). If the network is ' +
    'running, it will be temporarily stopped during the rename operation.',
  inputSchema: {
    type: 'object',
    properties: {
      networkId: {
        type: 'number',
        description: 'ID of the network containing the node to rename',
      },
      oldName: {
        type: 'string',
        description: 'Current name of the node to rename',
      },
      newName: {
        type: 'string',
        description: 'New name for the node',
      },
    },
    required: ['networkId', 'oldName', 'newName'],
  },
};

/** The implementation for the rename_node tool */
export const renameNodeTool: Thunk<
  Record<string, never>,
  RenameNodeArgs,
  StoreInjections,
  RootModel,
  Promise<RenameNodeResult>
> = thunk(
  async (
    actions,
    args,
    { getStoreState, getStoreActions },
  ): Promise<RenameNodeResult> => {
    // Validate required parameters
    validateNetworkId(args.networkId);
    validateRequired(args.oldName, 'Old node name');
    validateRequired(args.newName, 'New node name');

    // Validate new name format
    if (!/^[a-zA-Z0-9_-]+$/.test(args.newName)) {
      throw new Error(
        'New node name must contain only letters, numbers, hyphens, and underscores',
      );
    }

    // Check if network exists
    const { networks } = getStoreState().network;
    const network = networks.find(n => n.id === args.networkId);
    if (!network) {
      throw new Error(`Network with ID ${args.networkId} not found`);
    }

    // Find the node in the network
    const allNodes: CommonNode[] = [
      ...network.nodes.lightning,
      ...network.nodes.bitcoin,
      ...network.nodes.tap,
    ];
    const nodeToRename = allNodes.find(n => n.name === args.oldName);
    if (!nodeToRename) {
      throw new Error(
        `Node "${args.oldName}" not found in network "${network.name}". ` +
          `Available nodes: ${allNodes.map(n => n.name).join(', ')}`,
      );
    }

    // Check if new name is already taken by a different node
    const existingNode = allNodes.find(n => n.name === args.newName);
    if (existingNode && existingNode !== nodeToRename) {
      throw new Error(
        `Node name "${args.newName}" is already taken by another node in network "${network.name}"`,
      );
    }

    info('MCP: Renaming node in network:', args);

    // Call the rename method
    await getStoreActions().network.renameNode({
      node: nodeToRename as any, // Cast to AnyNode as expected by the renameNode function
      newName: args.newName,
    });

    // Return success message
    const nodeTypeName =
      nodeToRename.type === 'bitcoin'
        ? 'Bitcoin'
        : nodeToRename.type === 'tap'
        ? 'Taproot Asset'
        : 'Lightning';
    return {
      success: true,
      message: `${nodeTypeName} node "${args.oldName}" renamed to "${args.newName}" in network "${network.name}" successfully`,
    };
  },
);
