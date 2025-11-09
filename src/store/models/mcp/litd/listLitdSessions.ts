import { info } from 'electron-log';
import { thunk } from 'easy-peasy';
import { Session as LitdSession } from 'lib/litd/types';
import { RootModel } from 'store/models';
import { findNode, validateNetworkId, validateRequired } from 'store/models/mcp/helpers';
import { McpToolDefinition } from 'store/models/mcp/types';
import { StoreInjections } from 'types';

/** The arguments for the list_litd_sessions tool */
export interface ListLitdSessionsArgs {
  networkId: number;
  nodeName: string;
}

/** The result of the list_litd_sessions tool */
export interface ListLitdSessionsResult {
  success: boolean;
  message: string;
  networkId: number;
  nodeName: string;
  sessions: LitdSession[];
}

/** The definition of the list_litd_sessions tool which will be provided to the LLM */
export const listLitdSessionsDefinition: McpToolDefinition = {
  name: 'list_litd_sessions',
  description:
    'List all Lightning Node Connect (LNC) sessions for a litd node. This provides ' +
    'information about active sessions including labels, states, pairing phrases, ' +
    'and expiration times. Useful for managing remote Lightning node connections.',
  inputSchema: {
    type: 'object',
    properties: {
      networkId: {
        type: 'number',
        description: 'ID of the network',
      },
      nodeName: {
        type: 'string',
        description: 'Name of the litd node to list sessions for',
      },
    },
    required: ['networkId', 'nodeName'],
  },
};

/** The implementation for the list_litd_sessions tool */
export const listLitdSessionsTool = thunk<
  Record<string, never>,
  ListLitdSessionsArgs,
  StoreInjections,
  RootModel,
  Promise<ListLitdSessionsResult>
>(
  async (
    actions,
    args,
    { getStoreState, injections },
  ): Promise<ListLitdSessionsResult> => {
    // Validate required parameters
    validateNetworkId(args.networkId);
    validateRequired(args.nodeName, 'Node name');

    info('MCP: Listing litd sessions:', args);

    // Find the network (networkById throws if not found)
    const network = getStoreState().network.networkById(args.networkId);

    // Find the litd node
    const node = findNode(network, args.nodeName, 'litd');

    // Get sessions directly from the service
    const sessions = await injections.litdService.listSessions(node);

    return {
      success: true,
      message: `Found ${sessions.length} session(s) for litd node "${args.nodeName}"`,
      networkId: args.networkId,
      nodeName: args.nodeName,
      sessions,
    };
  },
);
