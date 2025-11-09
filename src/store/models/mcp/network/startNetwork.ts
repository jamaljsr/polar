import { info } from 'electron-log';
import { thunk } from 'easy-peasy';
import { RootModel } from 'store/models';
import { McpToolDefinition, NetworkIdArgs } from 'store/models/mcp/types';
import { Network, StoreInjections } from 'types';
import { validateNetworkId } from 'store/models/mcp/helpers';

/** The result of the start_network tool */
interface StartNetworkResult {
  success: boolean;
  message: string;
  network: Network;
}

/** The definition of the start_network tool which will be provided to the LLM */
export const startNetworkDefinition: McpToolDefinition = {
  name: 'start_network',
  description:
    'Starts a Lightning Network in Polar. This will start all Bitcoin and Lightning nodes in the ' +
    'specified network.',
  inputSchema: {
    type: 'object',
    properties: {
      networkId: {
        type: 'number',
        description: 'ID of the network to start',
      },
    },
    required: ['networkId'],
  },
};

/** The implementation for the start_network tool */
export const startNetworkTool = thunk<
  Record<string, never>,
  NetworkIdArgs,
  StoreInjections,
  RootModel,
  Promise<StartNetworkResult>
>(async (actions, args, { getStoreState, getStoreActions }) => {
  // Validate required parameters
  validateNetworkId(args.networkId);

  info('MCP: Starting network with ID:', args.networkId);

  // Find the network (networkById throws if not found)
  let network = getStoreState().network.networkById(args.networkId);

  // Start the network using the network store action
  await getStoreActions().network.start(args.networkId);

  // Get the network with updated status from the store
  network = getStoreState().network.networkById(args.networkId);

  return {
    success: true,
    message: `Network "${network.name}" started successfully`,
    network,
  };
});
