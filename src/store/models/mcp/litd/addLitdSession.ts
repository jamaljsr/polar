import { info } from 'electron-log';
import { thunk } from 'easy-peasy';
import { Session as LitdSession } from 'lib/litd/types';
import { RootModel } from 'store/models';
import { findNode, validateNetworkId, validateRequired } from 'store/models/mcp/helpers';
import { McpToolDefinition } from 'store/models/mcp/types';
import { StoreInjections } from 'types';
import { LNC_MAILBOX_SERVER } from 'utils/constants';

/** The arguments for the add_litd_session tool */
export interface AddLitdSessionArgs {
  networkId: number;
  nodeName: string;
  label: string;
  type: 'admin' | 'read_only' | 'custom';
  expiresAt?: number;
  mailboxServerAddr?: string;
}

/** The result of the add_litd_session tool */
export interface AddLitdSessionResult {
  success: boolean;
  message: string;
  networkId: number;
  nodeName: string;
  session: LitdSession;
}

/** The definition of the add_litd_session tool which will be provided to the LLM */
export const addLitdSessionDefinition: McpToolDefinition = {
  name: 'add_litd_session',
  description:
    'Create a new Lightning Node Connect (LNC) session for a litd node. This generates ' +
    'a pairing phrase that can be used to connect remote applications to the Lightning node. ' +
    'Sessions can be admin (full access), read_only (view only), or custom (specific permissions).',
  inputSchema: {
    type: 'object',
    properties: {
      networkId: {
        type: 'number',
        description: 'ID of the network',
      },
      nodeName: {
        type: 'string',
        description: 'Name of the litd node to create session for',
      },
      label: {
        type: 'string',
        description: 'Human-readable label for the session',
      },
      type: {
        type: 'string',
        enum: ['admin', 'read_only'],
        description: 'Type of session permissions',
      },
      expiresAt: {
        type: 'number',
        description:
          'Unix timestamp when the session expires (in seconds). Defaults to 90 days ' +
          'from now if not provided.',
      },
      mailboxServerAddr: {
        type: 'string',
        description:
          'Optional mailbox server address for the session (defaults to ' +
          `${LNC_MAILBOX_SERVER})`,
      },
    },
    required: ['networkId', 'nodeName', 'label', 'type'],
  },
};

/** The implementation for the add_litd_session tool */
export const addLitdSessionTool = thunk<
  Record<string, never>,
  AddLitdSessionArgs,
  StoreInjections,
  RootModel,
  Promise<AddLitdSessionResult>
>(
  async (
    actions,
    args,
    { getStoreState, getStoreActions },
  ): Promise<AddLitdSessionResult> => {
    // Validate required parameters
    validateNetworkId(args.networkId);
    validateRequired(args.nodeName, 'Node name');
    validateRequired(args.label, 'Session label');
    if (!['admin', 'read_only'].includes(args.type)) {
      throw new Error('Session type must be admin or read_only');
    }

    // Set default expiration to 90 days from now if not provided
    const expiresAt =
      args.expiresAt || Math.floor((Date.now() + 90 * 24 * 60 * 60 * 1000) / 1000);

    if (expiresAt * 1000 <= Date.now()) {
      throw new Error('Session expiration must be a future timestamp');
    }

    info('MCP: Adding litd session:', args);

    // Find the network (networkById throws if not found)
    const network = getStoreState().network.networkById(args.networkId);

    // Find the litd node
    const node = findNode(network, args.nodeName, 'litd');

    // Convert type to match the expected format
    const sessionType: LitdSession['type'] =
      args.type === 'admin' ? 'Admin' : 'Read Only';

    // Create the session
    const session = await getStoreActions().lit.addSession({
      node,
      label: args.label,
      type: sessionType,
      expiresAt: expiresAt * 1000,
      mailboxServerAddr: args.mailboxServerAddr || LNC_MAILBOX_SERVER,
    });

    return {
      success: true,
      message: `Created LNC session "${args.label}" for litd node "${args.nodeName}" with pairing phrase`,
      networkId: args.networkId,
      nodeName: args.nodeName,
      session,
    };
  },
);
