import { info } from 'electron-log';
import { thunk } from 'easy-peasy';
import { RootModel } from 'store/models';
import { findNode, validateNetworkId, validateRequired } from 'store/models/mcp/helpers';
import { McpToolDefinition } from 'store/models/mcp/types';
import { StoreInjections } from 'types';

/** The arguments for the get_wallet_balance tool */
export interface GetWalletBalanceArgs {
  networkId: number;
  nodeName: string;
}

/** The result of the get_wallet_balance tool */
export interface GetWalletBalanceResult {
  success: boolean;
  message: string;
  networkId: number;
  nodeName: string;
  balance: {
    total: string;
    confirmed: string;
    unconfirmed: string;
  };
}

/** The definition of the get_wallet_balance tool which will be provided to the LLM */
export const getWalletBalanceDefinition: McpToolDefinition = {
  name: 'get_wallet_balance',
  description:
    'Get the on-chain wallet balance for a Lightning node (LND, c-lightning, eclair, or litd). ' +
    'Returns the total, confirmed, and unconfirmed balances in satoshis. This shows the funds ' +
    "available in the node's on-chain Bitcoin wallet that can be used to open channels or for " +
    'on-chain transactions. Note: This does not return channel balances - use list_channels to see ' +
    'balances within Lightning channels.',
  inputSchema: {
    type: 'object',
    properties: {
      networkId: {
        type: 'number',
        description: 'ID of the network',
      },
      nodeName: {
        type: 'string',
        description: 'Name of the Lightning node to get balance for',
      },
    },
    required: ['networkId', 'nodeName'],
  },
};

/** The implementation for the get_wallet_balance tool */
export const getWalletBalanceTool = thunk<
  Record<string, never>,
  GetWalletBalanceArgs,
  StoreInjections,
  RootModel,
  Promise<GetWalletBalanceResult>
>(
  async (
    actions,
    args,
    { getStoreState, getStoreActions },
  ): Promise<GetWalletBalanceResult> => {
    // Validate required parameters
    validateNetworkId(args.networkId);
    validateRequired(args.nodeName, 'Node name');

    info('MCP: Getting wallet balance:', args);

    // Find the network (networkById throws if not found)
    const network = getStoreState().network.networkById(args.networkId);

    // Find the Lightning node
    const node = findNode(network, args.nodeName, 'lightning');

    // Get wallet balance from the lightning service
    await getStoreActions().lightning.getWalletBalance(node);

    // Retrieve balance from state
    const lightningState = getStoreState().lightning;
    const nodeState = lightningState.nodes[node.name];
    const balance = nodeState?.walletBalance || {
      total: '0',
      confirmed: '0',
      unconfirmed: '0',
    };

    return {
      success: true,
      message: `Retrieved balance for node "${args.nodeName}": ${balance.total} sats total`,
      networkId: args.networkId,
      nodeName: args.nodeName,
      balance: {
        total: balance.total,
        confirmed: balance.confirmed,
        unconfirmed: balance.unconfirmed,
      },
    };
  },
);
