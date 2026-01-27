import { info } from 'electron-log';
import { thunk } from 'easy-peasy';
import { RootModel } from 'store/models';
import { McpToolDefinition, NetworkIdArgs } from 'store/models/mcp/types';
import { Network, StoreInjections } from 'types';
import { validateNetworkId } from 'store/models/mcp/helpers';

/** The result of the delete_network tool */
export interface DeleteNetworkResult {
  success: boolean;
  message: string;
  network: Network;
}

/** The definition of the delete_network tool which will be provided to the LLM */
export const deleteNetworkDefinition: McpToolDefinition = {
  name: 'delete_network',
  description:
    'Permanently deletes a Lightning Network in Polar. This will remove all nodes, channels, ' +
    'and data associated with the network. This action cannot be undone.',
  inputSchema: {
    type: 'object',
    properties: {
      networkId: {
        type: 'number',
        description: 'ID of the network to delete',
      },
    },
    required: ['networkId'],
  },
};

/** The implementation for the delete_network tool */
export const deleteNetworkTool = thunk<
  Record<string, never>,
  NetworkIdArgs,
  StoreInjections,
  RootModel,
  Promise<DeleteNetworkResult>
>(async (actions, args, { getStoreState, getStoreActions }) => {
  // Validate required parameters
  validateNetworkId(args.networkId);

  info('MCP: Deleting network with ID:', args.networkId);

  // Find the network (networkById throws if not found)
  const network = getStoreState().network.networkById(args.networkId);

  // Delete the network using the network store action
  await getStoreActions().network.remove(args.networkId);

  return {
    success: true,
    message: `Network "${network.name}" deleted successfully`,
    network,
  };
});
