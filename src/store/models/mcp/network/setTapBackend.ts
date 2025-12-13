import { info } from 'electron-log';
import { thunk } from 'easy-peasy';
import { TapdNode } from 'shared/types';
import { RootModel } from 'store/models';
import { findNode, validateNetworkId, validateRequired } from 'store/models/mcp/helpers';
import { McpToolDefinition } from 'store/models/mcp/types';
import { StoreInjections } from 'types';
import { exists } from 'utils/files';
import { isVersionCompatible } from 'utils/strings';

/** The arguments for the set_tap_backend tool */
export interface SetTapBackendArgs {
  networkId: number;
  tapNodeName: string;
  lndNodeName: string;
}

/** The result of the set_tap_backend tool */
export interface SetTapBackendResult {
  success: boolean;
  message: string;
  networkId: number;
  tapNodeName: string;
  lndNodeName: string;
}

/** The definition of the set_tap_backend tool which will be provided to the LLM */
export const setTapBackendDefinition: McpToolDefinition = {
  name: 'set_tap_backend',
  description:
    'Changes the LND backend node for a Taproot Assets (TAP) node. This reassigns which ' +
    'LND node the TAP node will connect to as its backend.',
  inputSchema: {
    type: 'object',
    properties: {
      networkId: {
        type: 'number',
        description: 'ID of the network containing the nodes',
      },
      tapNodeName: {
        type: 'string',
        description: 'Name of the TAP node whose backend should be changed',
      },
      lndNodeName: {
        type: 'string',
        description: 'Name of the LND node to set as the backend',
      },
    },
    required: ['networkId', 'tapNodeName', 'lndNodeName'],
  },
};

/** The implementation for the set_tap_backend tool */
export const setTapBackendTool = thunk<
  Record<string, never>,
  SetTapBackendArgs,
  StoreInjections,
  RootModel,
  Promise<SetTapBackendResult>
>(async (actions, args, { getStoreState, getStoreActions }) => {
  // Validate required parameters
  validateNetworkId(args.networkId);
  validateRequired(args.tapNodeName, 'TAP node name');
  validateRequired(args.lndNodeName, 'LND node name');

  // Find the network (networkById throws if not found)
  const network = getStoreState().network.networkById(args.networkId);
  const dockerRepoState = getStoreState().app.dockerRepoState;

  // Find the TAP and LND nodes
  const tapNode = findNode(network, args.tapNodeName, 'tap') as TapdNode;
  const lndNode = findNode(network, args.lndNodeName, 'lightning');

  info('MCP: Setting TAP backend:', args);

  // Cannot change the backend if the node was already started once
  const macaroonPresent = await exists(tapNode.paths.adminMacaroon);
  if (macaroonPresent) {
    throw new Error(
      `Cannot change backend for TAP node "${args.tapNodeName}" because it has been ` +
        'started before. This would result in asset loss.',
    );
  }

  // Check version compatibility
  const { compatibility } = dockerRepoState.images[tapNode.implementation];
  if (compatibility && compatibility[tapNode.version]) {
    const requiredVersion = compatibility[tapNode.version];
    const isCompatible = isVersionCompatible(lndNode.version, requiredVersion);
    const isLowerVersion = isCompatible && lndNode.version !== requiredVersion;

    // Throw error for incompatible versions (LND version too low)
    if (isLowerVersion) {
      throw new Error(
        `LND node "${args.lndNodeName}" (version ${lndNode.version}) is not compatible ` +
          `with TAP node "${args.tapNodeName}" (version ${tapNode.version}). Required ` +
          `LND version: ${requiredVersion} or higher.`,
      );
    }
  }

  // Set the backend using the network store action
  await getStoreActions().network.updateTapBackendNode({
    id: args.networkId,
    tapName: args.tapNodeName,
    lndName: args.lndNodeName,
  });

  return {
    success: true,
    message:
      `Successfully changed backend for TAP node "${args.tapNodeName}" to LND ` +
      `node "${args.lndNodeName}" in network "${network.name}"`,
    networkId: args.networkId,
    tapNodeName: args.tapNodeName,
    lndNodeName: args.lndNodeName,
  };
});
