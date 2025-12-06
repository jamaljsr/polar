import { info } from 'electron-log';
import { thunk } from 'easy-peasy';
import { RootModel } from 'store/models';
import { findNode, validateNetworkId, validateRequired } from 'store/models/mcp/helpers';
import { McpToolDefinition } from 'store/models/mcp/types';
import { StoreInjections } from 'types';

/** The arguments for the revoke_litd_session tool */
export interface RevokeLitdSessionArgs {
  networkId: number;
  nodeName: string;
  localPublicKey: string;
}

/** The result of the revoke_litd_session tool */
export interface RevokeLitdSessionResult {
  success: boolean;
  message: string;
  networkId: number;
  nodeName: string;
}

/** The definition of the revoke_litd_session tool which will be provided to the LLM */
export const revokeLitdSessionDefinition: McpToolDefinition = {
  name: 'revoke_litd_session',
  description:
    'Revoke an existing Lightning Node Connect (LNC) session for a litd node. ' +
    'This permanently disables the session and invalidates its pairing phrase. ' +
    'The session will no longer be usable for remote connections.',
  inputSchema: {
    type: 'object',
    properties: {
      networkId: {
        type: 'number',
        description: 'ID of the network',
      },
      nodeName: {
        type: 'string',
        description: 'Name of the litd node to revoke session for',
      },
      localPublicKey: {
        type: 'string',
        description: 'Local public key of the session to revoke',
      },
    },
    required: ['networkId', 'nodeName', 'localPublicKey'],
  },
};

/** The implementation for the revoke_litd_session tool */
export const revokeLitdSessionTool = thunk<
  Record<string, never>,
  RevokeLitdSessionArgs,
  StoreInjections,
  RootModel,
  Promise<RevokeLitdSessionResult>
>(
  async (
    actions,
    args,
    { getStoreState, getStoreActions },
  ): Promise<RevokeLitdSessionResult> => {
    // Validate required parameters
    validateNetworkId(args.networkId);
    validateRequired(args.nodeName, 'Node name');
    validateRequired(args.localPublicKey, 'Local public key');

    info('MCP: Revoking litd session:', args);

    // Find the network (networkById throws if not found)
    const network = getStoreState().network.networkById(args.networkId);

    // Find the litd node
    const node = findNode(network, args.nodeName, 'litd');

    // Revoke the session
    await getStoreActions().lit.revokeSession({
      node,
      localPublicKey: args.localPublicKey,
    });

    return {
      success: true,
      message: `Revoked LNC session with public key "${args.localPublicKey.slice(
        0,
        12,
      )}..." for litd node "${args.nodeName}"`,
      networkId: args.networkId,
      nodeName: args.nodeName,
    };
  },
);
