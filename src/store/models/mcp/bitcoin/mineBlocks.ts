import { info } from 'electron-log';
import { thunk } from 'easy-peasy';
import { RootModel } from 'store/models';
import {
  findNode,
  validateNetworkId,
  validatePositiveNumber,
} from 'store/models/mcp/helpers';
import { McpToolDefinition } from 'store/models/mcp/types';
import { StoreInjections } from 'types';

/** The arguments for the mine_blocks tool */
export interface MineBlocksArgs {
  networkId: number;
  blocks?: number;
  nodeName?: string;
}

/** The result of the mine_blocks tool */
export interface MineBlocksResult {
  success: boolean;
  message: string;
  networkId: number;
  nodeName: string;
  blocksMined: number;
}

/** The definition of the mine_blocks tool which will be provided to the LLM */
export const mineBlocksDefinition: McpToolDefinition = {
  name: 'mine_blocks',
  description:
    'Mine Bitcoin blocks in a Polar network. This generates new blocks on the Bitcoin blockchain, ' +
    'which is necessary for confirming transactions and advancing the chain.',
  inputSchema: {
    type: 'object',
    properties: {
      networkId: {
        type: 'number',
        description: 'ID of the network',
      },
      blocks: {
        type: 'number',
        description: 'Number of blocks to mine (default: 6)',
        default: 6,
      },
      nodeName: {
        type: 'string',
        description:
          'Name of the Bitcoin node to mine with (optional, uses first node if not specified)',
      },
    },
    required: ['networkId'],
  },
};

/** The implementation for the mine_blocks tool */
export const mineBlocksTool = thunk<
  Record<string, never>,
  MineBlocksArgs,
  StoreInjections,
  RootModel,
  Promise<MineBlocksResult>
>(async (actions, args, { getStoreState, getStoreActions }) => {
  // Validate required parameters
  validateNetworkId(args.networkId);

  // Default to 6 blocks if not specified
  const blocks = args.blocks ?? 6;

  validatePositiveNumber(blocks, 'Number of blocks');

  info('MCP: Mining blocks:', { ...args, blocks });

  // Find the network (networkById throws if not found)
  const network = getStoreState().network.networkById(args.networkId);

  // Find the Bitcoin node
  const bitcoinNode = findNode(network, args.nodeName, 'bitcoin');

  // Mine the blocks using the bitcoin store action
  await getStoreActions().bitcoin.mine({
    blocks,
    node: bitcoinNode,
  });

  return {
    success: true,
    message: `Mined ${blocks} block${blocks > 1 ? 's' : ''} on node "${
      bitcoinNode.name
    }"`,
    networkId: args.networkId,
    nodeName: bitcoinNode.name,
    blocksMined: blocks,
  };
});
