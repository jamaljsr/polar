import { info } from 'electron-log';
import { thunk, Thunk } from 'easy-peasy';
import { RootModel } from 'store/models';
import {
  findNode,
  validateNetworkId,
  validatePositiveNumber,
  validateRequired,
} from 'store/models/mcp/helpers';
import { McpToolDefinition } from 'store/models/mcp/types';
import { StoreInjections } from 'types';

/** The arguments for the send_bitcoin tool */
export interface SendBitcoinArgs {
  networkId: number;
  fromNode: string;
  toAddress: string;
  amount: number;
  autoMine?: boolean;
}

/** The result of the send_bitcoin tool */
export interface SendBitcoinResult {
  success: boolean;
  message: string;
  networkId: number;
  fromNode: string;
  toAddress: string;
  amount: number;
  txid: string;
  autoMined?: boolean;
}

/** The definition of the send_bitcoin tool which will be provided to the LLM */
export const sendBitcoinDefinition: McpToolDefinition = {
  name: 'send_bitcoin',
  description:
    'Send on-chain Bitcoin transaction from a Bitcoin node to an address, ' +
    'optionally mining blocks to confirm the transaction.',
  inputSchema: {
    type: 'object',
    properties: {
      networkId: {
        type: 'number',
        description: 'ID of the network',
      },
      fromNode: {
        type: 'string',
        description: 'Name of the node sending the Bitcoin',
      },
      toAddress: {
        type: 'string',
        description: 'Bitcoin address to send to',
      },
      amount: {
        type: 'number',
        description: 'Amount of Bitcoin to send (in bitcoin, so 0.00000001 is 1 satoshi)',
      },
      autoMine: {
        type: 'boolean',
        description:
          'Whether to automatically mine 6 blocks to confirm the transaction (default: false)',
        default: false,
      },
    },
    required: ['networkId', 'fromNode', 'toAddress', 'amount'],
  },
};

/** The implementation for the send_bitcoin tool */
export const sendBitcoinTool: Thunk<
  Record<string, never>,
  SendBitcoinArgs,
  StoreInjections,
  RootModel,
  Promise<SendBitcoinResult>
> = thunk(
  async (
    actions,
    args,
    { getStoreState, getStoreActions },
  ): Promise<SendBitcoinResult> => {
    // Validate required parameters
    validateNetworkId(args.networkId);
    validateRequired(args.fromNode, 'From node name');
    validateRequired(args.toAddress, 'To address');
    validatePositiveNumber(args.amount, 'Amount');

    info('MCP: Sending Bitcoin:', { ...args, autoMine: args.autoMine ?? false });

    // Find the network (networkById throws if not found)
    const network = getStoreState().network.networkById(args.networkId);

    // Find the Bitcoin node
    const bitcoinNode = findNode(network, args.fromNode, 'bitcoin');

    // Send funds from the Bitcoin node
    const txid = await getStoreActions().bitcoin.sendFunds({
      node: bitcoinNode,
      toAddress: args.toAddress,
      amount: args.amount,
      autoMine: args.autoMine ?? false,
    });
    const autoMined = args.autoMine ?? false;

    return {
      success: true,
      message: `Sent ${args.amount} bitcoin from "${args.fromNode}" to ${args.toAddress}${
        autoMined ? ' (auto-mined 6 blocks)' : ''
      }`,
      networkId: args.networkId,
      fromNode: args.fromNode,
      toAddress: args.toAddress,
      amount: args.amount,
      txid,
      autoMined: autoMined || undefined,
    };
  },
);
