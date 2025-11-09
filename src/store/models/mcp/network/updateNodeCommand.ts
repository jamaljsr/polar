import { info } from 'electron-log';
import { thunk } from 'easy-peasy';
import { RootModel } from 'store/models';
import { validateNetworkId, validateRequired } from 'store/models/mcp/helpers';
import { McpToolDefinition } from 'store/models/mcp/types';
import { StoreInjections } from 'types';

/** The arguments for the update_node_command tool */
export interface UpdateNodeCommandArgs {
  networkId: number;
  nodeName: string;
  command: string;
}

/** The result of the update_node_command tool */
export interface UpdateNodeCommandResult {
  success: boolean;
  message: string;
  networkId: number;
  nodeName: string;
  command: string;
}

/** The definition of the update_node_command tool which will be provided to the LLM */
export const updateNodeCommandDefinition: McpToolDefinition = {
  name: 'update_node_command',
  description:
    'Updates the custom docker command for a node in a network. This allows customization of ' +
    'node startup parameters. The command will be used instead of the default command for the ' +
    'node implementation. Leave command empty to reset to the default.',
  inputSchema: {
    type: 'object',
    properties: {
      networkId: {
        type: 'number',
        description: 'ID of the network containing the node',
      },
      nodeName: {
        type: 'string',
        description: 'Name of the node whose command should be updated',
      },
      command: {
        type: 'string',
        description:
          'The docker command to use for the node. Empty string resets to default.',
      },
    },
    required: ['networkId', 'nodeName', 'command'],
  },
};

/** The implementation for the update_node_command tool */
export const updateNodeCommandTool = thunk<
  Record<string, never>,
  UpdateNodeCommandArgs,
  StoreInjections,
  RootModel,
  Promise<UpdateNodeCommandResult>
>(async (actions, args, { getStoreState, getStoreActions }) => {
  // Validate required parameters
  validateNetworkId(args.networkId);
  validateRequired(args.nodeName, 'Node name');
  if (args.command === undefined) {
    throw new Error('Command is required (use empty string to reset to default)');
  }

  // Find the network (networkById throws if not found)
  const network = getStoreState().network.networkById(args.networkId);

  // Find the node in the network
  const node = [
    ...network.nodes.bitcoin,
    ...network.nodes.lightning,
    ...network.nodes.tap,
  ].find(n => n.name === args.nodeName);

  if (!node) {
    throw new Error(`Node "${args.nodeName}" not found in network "${network.name}"`);
  }

  info('MCP: Updating node command:', args);

  // Update the node command using the network store action
  await getStoreActions().network.updateAdvancedOptions({
    node,
    command: args.command,
  });

  return {
    success: true,
    message: args.command
      ? `Successfully updated custom command for node "${args.nodeName}" in network "${network.name}"`
      : `Successfully reset node "${args.nodeName}" to use default command in network "${network.name}"`,
    networkId: args.networkId,
    nodeName: args.nodeName,
    command: args.command,
  };
});
