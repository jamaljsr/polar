import { info } from 'electron-log';
import { thunk } from 'easy-peasy';
import { RootModel } from 'store/models';
import { McpToolDefinition, NetworkIdArgs } from 'store/models/mcp/types';
import { Network, StoreInjections } from 'types';
import { validateNetworkId } from 'store/models/mcp/helpers';

/** The result of the stop_network tool */
interface StopNetworkResult {
  success: boolean;
  message: string;
  network: Network;
}

/** The definition of the stop_network tool which will be provided to the LLM */
export const stopNetworkDefinition: McpToolDefinition = {
  name: 'stop_network',
  description:
    'Stops a Lightning Network in Polar. This will gracefully shut down all Bitcoin and Lightning nodes ' +
    'in the specified network.',
  inputSchema: {
    type: 'object',
    properties: {
      networkId: {
        type: 'number',
        description: 'ID of the network to stop',
      },
    },
    required: ['networkId'],
  },
};

/** The implementation for the stop_network tool */
export const stopNetworkTool = thunk<
  Record<string, never>,
  NetworkIdArgs,
  StoreInjections,
  RootModel,
  Promise<StopNetworkResult>
>(async (actions, args, { getStoreState, getStoreActions }) => {
  // Validate required parameters
  validateNetworkId(args.networkId);

  info('MCP: Stopping network with ID:', args.networkId);

  // Find the network (networkById throws if not found)
  let network = getStoreState().network.networkById(args.networkId);

  // Stop the network using the network store action
  await getStoreActions().network.stop(args.networkId);

  // Get the network with updated status from the store
  network = getStoreState().network.networkById(args.networkId);

  return {
    success: true,
    message: `Network "${network.name}" stopped successfully`,
    network,
  };
});
