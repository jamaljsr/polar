import { info } from 'electron-log';
import { push } from 'connected-react-router';
import { thunk } from 'easy-peasy';
import { RootModel } from 'store/models';
import { McpToolDefinition } from 'store/models/mcp/types';
import { Network, StoreInjections } from 'types';
import { validateNetworkId, validateRequired } from 'store/models/mcp/helpers';
import { NETWORK_VIEW } from 'components/routing';

/** Arguments for the rename_network tool */
export interface RenameNetworkArgs {
  networkId: number;
  name: string;
  description?: string;
}

/** The result of the rename_network tool */
export interface RenameNetworkResult {
  success: boolean;
  message: string;
  network: Network;
}

/** The definition of the rename_network tool which will be provided to the LLM */
export const renameNetworkDefinition: McpToolDefinition = {
  name: 'rename_network',
  description:
    'Renames a Lightning Network in Polar and optionally updates its description. ' +
    'The name is used for identification and must be unique among networks.',
  inputSchema: {
    type: 'object',
    properties: {
      networkId: {
        type: 'number',
        description: 'ID of the network to rename',
      },
      name: {
        type: 'string',
        description: 'New name for the network',
      },
      description: {
        type: 'string',
        description: 'Optional new description for the network',
      },
    },
    required: ['networkId', 'name'],
  },
};

/** The implementation for the rename_network tool */
export const renameNetworkTool = thunk<
  Record<string, never>,
  RenameNetworkArgs,
  StoreInjections,
  RootModel,
  Promise<RenameNetworkResult>
>(async (actions, args, { getStoreState, getStoreActions, dispatch }) => {
  // Validate required parameters
  validateNetworkId(args.networkId);

  validateRequired(args.name, 'Network name');

  info('MCP: Renaming network with ID:', args.networkId);

  // Find the network (networkById throws if not found)
  const network = getStoreState().network.networkById(args.networkId);

  // Use the network store action to rename
  await getStoreActions().network.rename({
    id: args.networkId,
    name: args.name,
    description: args.description ?? network.description,
  });

  // Fetch the updated network to return the latest state
  const updatedNetwork = getStoreState().network.networkById(args.networkId);

  // Navigate to the updated network to display the new name
  dispatch(push(NETWORK_VIEW(updatedNetwork.id)));

  return {
    success: true,
    message: `Network renamed to "${args.name}" successfully`,
    network: updatedNetwork,
  };
});
