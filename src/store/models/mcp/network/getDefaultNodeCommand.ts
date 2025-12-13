import { info } from 'electron-log';
import { thunk } from 'easy-peasy';
import { NodeImplementation } from 'shared/types';
import { RootModel } from 'store/models';
import { validateRequired } from 'store/models/mcp/helpers';
import { McpToolDefinition } from 'store/models/mcp/types';
import { StoreInjections } from 'types';
import { defaultRepoState } from 'utils/constants';
import { getDefaultCommand } from 'utils/network';

/** The arguments for the get_default_node_command tool */
export interface GetDefaultNodeCommandArgs {
  implementation: NodeImplementation;
  version?: string;
}

/** The result of the get_default_node_command tool */
export interface GetDefaultNodeCommandResult {
  success: boolean;
  implementation: NodeImplementation;
  version: string;
  command: string;
  message: string;
}

/** The definition of the get_default_node_command tool which will be provided to the LLM */
export const getDefaultNodeCommandDefinition: McpToolDefinition = {
  name: 'get_default_node_command',
  description:
    'Returns the default docker command for a given node implementation and version. ' +
    'The command includes placeholders like {{name}}, {{backendName}}, etc. that get ' +
    'replaced with actual values when the node starts. If version is not provided, ' +
    'the latest version will be used.',
  inputSchema: {
    type: 'object',
    properties: {
      implementation: {
        type: 'string',
        enum: ['bitcoind', 'btcd', 'LND', 'c-lightning', 'eclair', 'litd', 'tapd'],
        description: 'The node implementation to get the default command for',
      },
      version: {
        type: 'string',
        description:
          'Optional version of the implementation. Uses latest if not specified.',
      },
    },
    required: ['implementation'],
  },
};

/** The implementation for the get_default_node_command tool */
export const getDefaultNodeCommandTool = thunk<
  Record<string, never>,
  GetDefaultNodeCommandArgs,
  StoreInjections,
  RootModel,
  Promise<GetDefaultNodeCommandResult>
>(async (actions, args) => {
  // Validate required parameters
  validateRequired(args.implementation, 'Implementation');

  // Get the version - use latest if not provided
  const version = args.version || defaultRepoState.images[args.implementation].latest;

  info('MCP: Getting default node command:', args.implementation, version);

  // Get the default command
  const command = getDefaultCommand(args.implementation, version);

  return {
    success: true,
    implementation: args.implementation,
    version,
    command,
    message: `Retrieved default command for ${args.implementation} v${version}`,
  };
});
