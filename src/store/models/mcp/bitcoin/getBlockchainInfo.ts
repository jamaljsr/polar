import { info } from 'electron-log';
import { thunk } from 'easy-peasy';
import { RootModel } from 'store/models';
import { findNode, validateNetworkId } from 'store/models/mcp/helpers';
import { McpToolDefinition } from 'store/models/mcp/types';
import { StoreInjections } from 'types';

/** The arguments for the get_blockchain_info tool */
export interface GetBlockchainInfoArgs {
  networkId: number;
  nodeName?: string;
}

/** The result of the get_blockchain_info tool */
export interface GetBlockchainInfoResult {
  success: boolean;
  nodeName: string;
  chain: string;
  blocks: number;
  headers: number;
  bestblockhash: string;
  difficulty: number;
  mediantime: number;
  verificationprogress: number;
}

/** The definition of the get_blockchain_info tool which will be provided to the LLM */
export const getBlockchainInfoDefinition: McpToolDefinition = {
  name: 'get_blockchain_info',
  description:
    'Get blockchain information from a Bitcoin node in a Polar network. Returns current ' +
    'block height, chain name, difficulty, and other blockchain state.',
  inputSchema: {
    type: 'object',
    properties: {
      networkId: {
        type: 'number',
        description: 'ID of the network',
      },
      nodeName: {
        type: 'string',
        description:
          'Name of the Bitcoin node to query (optional, uses first node if not specified)',
      },
    },
    required: ['networkId'],
  },
};

/** The implementation for the get_blockchain_info tool */
export const getBlockchainInfoTool = thunk<
  Record<string, never>,
  GetBlockchainInfoArgs,
  StoreInjections,
  RootModel,
  Promise<GetBlockchainInfoResult>
>(async (actions, args, { getStoreState, getStoreActions }) => {
  // Validate required parameters to avoid undefined values
  validateNetworkId(args.networkId);

  info('MCP: Getting blockchain info:', args);

  // Find the network (networkById throws if not found)
  const network = getStoreState().network.networkById(args.networkId);

  // Find the Bitcoin node
  const bitcoinNode = findNode(network, args.nodeName, 'bitcoin');

  // Get the blockchain info using the bitcoin store action
  await getStoreActions().bitcoin.getInfo(bitcoinNode);

  // Retrieve the cached info from the store
  const bitcoinState = getStoreState().bitcoin;
  const nodeId = `${bitcoinNode.networkId}-${bitcoinNode.name}`;
  const nodeState = bitcoinState.nodes[nodeId];

  if (!nodeState || !nodeState.chainInfo) {
    throw new Error('Failed to retrieve blockchain info');
  }

  const chainInfo = nodeState.chainInfo;

  return {
    success: true,
    nodeName: bitcoinNode.name,
    chain: chainInfo.chain,
    blocks: chainInfo.blocks,
    headers: chainInfo.headers,
    bestblockhash: chainInfo.bestblockhash,
    difficulty: chainInfo.difficulty,
    mediantime: chainInfo.mediantime,
    verificationprogress: chainInfo.verificationprogress,
  };
});
