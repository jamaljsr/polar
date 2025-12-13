import { info } from 'electron-log';
import { thunk } from 'easy-peasy';
import { RootModel } from 'store/models';
import { validateNetworkId, validateRequired } from 'store/models/mcp/helpers';
import { McpToolDefinition } from 'store/models/mcp/types';
import { StoreInjections } from 'types';

/** The arguments for the set_lightning_backend tool */
export interface SetLightningBackendArgs {
  networkId: number;
  lightningNodeName: string;
  bitcoinNodeName: string;
}

/** The result of the set_lightning_backend tool */
export interface SetLightningBackendResult {
  success: boolean;
  message: string;
  networkId: number;
  lightningNodeName: string;
  bitcoinNodeName: string;
}

/** The definition of the set_lightning_backend tool which will be provided to the LLM */
export const setLightningBackendDefinition: McpToolDefinition = {
  name: 'set_lightning_backend',
  description:
    'Changes the Bitcoin backend node for a Lightning Network node. This reassigns which ' +
    'Bitcoin node the Lightning node will connect to as its backend. If the network is running, ' +
    'the Lightning node will be restarted to apply the change.',
  inputSchema: {
    type: 'object',
    properties: {
      networkId: {
        type: 'number',
        description: 'ID of the network containing the nodes',
      },
      lightningNodeName: {
        type: 'string',
        description: 'Name of the Lightning node whose backend should be changed',
      },
      bitcoinNodeName: {
        type: 'string',
        description: 'Name of the Bitcoin node to set as the backend',
      },
    },
    required: ['networkId', 'lightningNodeName', 'bitcoinNodeName'],
  },
};

/** The implementation for the set_lightning_backend tool */
export const setLightningBackendTool = thunk<
  Record<string, never>,
  SetLightningBackendArgs,
  StoreInjections,
  RootModel,
  Promise<SetLightningBackendResult>
>(async (actions, args, { getStoreState, getStoreActions }) => {
  // Validate required parameters
  validateNetworkId(args.networkId);
  validateRequired(args.lightningNodeName, 'Lightning node name');
  validateRequired(args.bitcoinNodeName, 'Bitcoin node name');

  // Find the network (networkById throws if not found)
  const network = getStoreState().network.networkById(args.networkId);

  info('MCP: Setting Lightning backend:', args);

  // Set the backend using the network store action
  await getStoreActions().network.updateBackendNode({
    id: args.networkId,
    lnName: args.lightningNodeName,
    backendName: args.bitcoinNodeName,
  });

  return {
    success: true,
    message: `Successfully changed backend for Lightning node "${args.lightningNodeName}" to Bitcoin node "${args.bitcoinNodeName}" in network "${network.name}"`,
    networkId: args.networkId,
    lightningNodeName: args.lightningNodeName,
    bitcoinNodeName: args.bitcoinNodeName,
  };
});
