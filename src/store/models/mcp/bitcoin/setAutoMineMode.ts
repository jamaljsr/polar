import { info } from 'electron-log';
import { thunk } from 'easy-peasy';
import { RootModel } from 'store/models';
import { McpToolDefinition } from 'store/models/mcp/types';
import { AutoMineMode, StoreInjections } from 'types';
import { validateNetworkId } from 'store/models/mcp/helpers';

/** The arguments for the set_auto_mine_mode tool */
export interface SetAutoMineModeArgs {
  networkId: number;
  mode: AutoMineMode;
}

/** The result of the set_auto_mine_mode tool */
export interface SetAutoMineModeResult {
  success: boolean;
  message: string;
  networkId: number;
  mode: AutoMineMode;
}

/** The definition of the set_auto_mine_mode tool which will be provided to the LLM */
export const setAutoMineModeDefinition: McpToolDefinition = {
  name: 'set_auto_mine_mode',
  description:
    'Set the auto-mining mode for a Polar network. Auto-mining automatically generates new ' +
    'blocks at regular intervals, which is useful for testing Lightning Network functionality.',
  inputSchema: {
    type: 'object',
    properties: {
      networkId: {
        type: 'number',
        description: 'ID of the network',
      },
      mode: {
        type: 'number',
        enum: [0, 30, 60, 300, 600],
        description:
          'Auto-mining mode: 0=Off, 30=Every 30s, 60=Every 1m, 300=Every 5m, 600=Every 10m',
      },
    },
    required: ['networkId', 'mode'],
  },
};

/** The implementation for the set_auto_mine_mode tool */
export const setAutoMineModeTool = thunk<
  Record<string, never>,
  SetAutoMineModeArgs,
  StoreInjections,
  RootModel,
  Promise<SetAutoMineModeResult>
>(async (actions, args, { getStoreState, getStoreActions }) => {
  // Validate required parameters
  validateNetworkId(args.networkId);

  if (args.mode == null) {
    throw new Error('Mode is required');
  }

  // Validate mode enum values
  const validModes = [
    AutoMineMode.AutoOff,
    AutoMineMode.Auto30s,
    AutoMineMode.Auto1m,
    AutoMineMode.Auto5m,
    AutoMineMode.Auto10m,
  ];
  if (!validModes.includes(args.mode)) {
    throw new Error(
      `Invalid mode: ${args.mode}. Valid modes are: ${validModes.join(', ')}`,
    );
  }

  info('MCP: Setting auto-mine mode:', args);

  // Find the network (networkById throws if not found)
  const network = getStoreState().network.networkById(args.networkId);

  // Set the auto-mine mode using the network store action
  await getStoreActions().network.setAutoMineMode({
    id: args.networkId,
    mode: args.mode,
  });

  // Get the mode name for the response message
  const modeNames: Record<AutoMineMode, string> = {
    [AutoMineMode.AutoOff]: 'Off',
    [AutoMineMode.Auto30s]: 'Every 30 seconds',
    [AutoMineMode.Auto1m]: 'Every 1 minute',
    [AutoMineMode.Auto5m]: 'Every 5 minutes',
    [AutoMineMode.Auto10m]: 'Every 10 minutes',
  };

  return {
    success: true,
    message: `Set auto-mine mode to "${modeNames[args.mode]}" for network "${
      network.name
    }"`,
    networkId: args.networkId,
    mode: args.mode,
    modeName: modeNames[args.mode],
  };
});
