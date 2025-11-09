import { info } from 'electron-log';
import { thunk } from 'easy-peasy';
import { RootModel } from 'store/models';
import {
  findNode,
  validateNetworkId,
  validateRequired,
  validatePositiveNumber,
} from 'store/models/mcp/helpers';
import { McpToolDefinition } from 'store/models/mcp/types';
import { StoreInjections } from 'types';

/** The arguments for the deposit_funds tool */
export interface DepositFundsArgs {
  networkId: number;
  nodeName: string;
  sats: number;
}

/** The result of the deposit_funds tool */
export interface DepositFundsResult {
  success: boolean;
  message: string;
  networkId: number;
  nodeName: string;
  sats: number;
}

/** The definition of the deposit_funds tool which will be provided to the LLM */
export const depositFundsDefinition: McpToolDefinition = {
  name: 'deposit_funds',
  description:
    'Deposit Bitcoin from the network to a Lightning node on-chain wallet. ' +
    'This sends funds from the Bitcoin Core node to the Lightning node, then mines blocks to confirm the transaction. ' +
    'The deposited funds will be available in the Lightning node wallet for opening channels or on-chain transactions. ' +
    'Works with LND, c-lightning, eclair, and litd nodes.',
  inputSchema: {
    type: 'object',
    properties: {
      networkId: {
        type: 'number',
        description: 'ID of the network',
      },
      nodeName: {
        type: 'string',
        description: 'Name of the Lightning node to deposit funds to',
      },
      sats: {
        type: 'number',
        description: 'Amount in satoshis to deposit',
        minimum: 1,
      },
    },
    required: ['networkId', 'nodeName', 'sats'],
  },
};

/** The implementation for the deposit_funds tool */
export const depositFundsTool = thunk<
  Record<string, never>,
  DepositFundsArgs,
  StoreInjections,
  RootModel,
  Promise<DepositFundsResult>
>(
  async (
    actions,
    args,
    { getStoreState, getStoreActions },
  ): Promise<DepositFundsResult> => {
    // Validate required parameters
    validateNetworkId(args.networkId);
    validateRequired(args.nodeName, 'Node name');
    validatePositiveNumber(args.sats, 'Amount in sats');

    info('MCP: Depositing funds:', args);

    // Find the network (networkById throws if not found)
    const network = getStoreState().network.networkById(args.networkId);

    // Find the Lightning node
    const node = findNode(network, args.nodeName, 'lightning');

    // Deposit funds to the Lightning node
    await getStoreActions().lightning.depositFunds({
      node,
      sats: args.sats.toString(),
    });

    return {
      success: true,
      message: `Deposited ${args.sats} sats to node "${args.nodeName}"`,
      networkId: args.networkId,
      nodeName: args.nodeName,
      sats: args.sats,
    };
  },
);
