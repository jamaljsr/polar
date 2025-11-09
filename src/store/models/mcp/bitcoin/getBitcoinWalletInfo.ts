import { info } from 'electron-log';
import { thunk } from 'easy-peasy';
import { RootModel } from 'store/models';
import { findNode, validateNetworkId } from 'store/models/mcp/helpers';
import { McpToolDefinition } from 'store/models/mcp/types';
import { StoreInjections } from 'types';
import { WalletInfoCompat } from 'types/bitcoin-core';

/** The arguments for the get_bitcoin_wallet_info tool */
export interface GetBitcoinWalletInfoArgs {
  networkId: number;
  nodeName?: string;
}

/** The result of the get_bitcoin_wallet_info tool */
export interface GetBitcoinWalletInfoResult {
  success: boolean;
  nodeName: string;
  walletInfo: WalletInfoCompat;
}

/** The definition of the get_bitcoin_wallet_info tool which will be provided to the LLM */
export const getBitcoinWalletInfoDefinition: McpToolDefinition = {
  name: 'get_bitcoin_wallet_info',
  description:
    'Get wallet information from a Bitcoin node including the total balance and transaction count. ' +
    'Returns the current wallet balance in BTC and the total number of transactions in the wallet.',
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

/** The implementation for the get_bitcoin_wallet_info tool */
export const getBitcoinWalletInfoTool = thunk<
  Record<string, never>,
  GetBitcoinWalletInfoArgs,
  StoreInjections,
  RootModel,
  Promise<GetBitcoinWalletInfoResult>
>(async (actions, args, { getStoreState, getStoreActions }) => {
  // Validate required parameters to avoid undefined values
  validateNetworkId(args.networkId);

  info('MCP: Getting bitcoin wallet info:', args);

  // Find the network (networkById throws if not found)
  const network = getStoreState().network.networkById(args.networkId);

  // Find the Bitcoin node
  const bitcoinNode = findNode(network, args.nodeName, 'bitcoin');

  // Get the wallet info using the bitcoin store action
  await getStoreActions().bitcoin.getInfo(bitcoinNode);

  // Retrieve the cached wallet info from the store
  const bitcoinState = getStoreState().bitcoin;
  const nodeId = `${bitcoinNode.networkId}-${bitcoinNode.name}`;
  const nodeState = bitcoinState.nodes[nodeId];

  if (!nodeState || !nodeState.walletInfo) {
    throw new Error('Failed to retrieve bitcoin wallet info');
  }

  const walletInfo = nodeState.walletInfo;

  return {
    success: true,
    nodeName: bitcoinNode.name,
    walletInfo: {
      ...walletInfo,
      balance: walletInfo.balance ?? 0,
      txcount: walletInfo.txcount ?? 0,
    },
  };
});
