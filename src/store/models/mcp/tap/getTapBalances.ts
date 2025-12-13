import { info } from 'electron-log';
import { thunk } from 'easy-peasy';
import * as PTAP from 'lib/tap/types';
import { RootModel } from 'store/models';
import { McpToolDefinition } from 'store/models/mcp/types';
import { StoreInjections } from 'types';
import { validateNetworkId, validateRequired } from 'store/models/mcp/helpers';
import { findNode } from '../helpers';

/** The arguments for the get_tap_balances tool */
export interface GetTapBalancesArgs {
  networkId: number;
  nodeName: string;
}

/** The result of the get_tap_balances tool */
export interface GetTapBalancesResult {
  balances: PTAP.TapBalance[];
}

/** The definition of the get_tap_balances tool which will be provided to the LLM */
export const getTapBalancesDefinition: McpToolDefinition = {
  name: 'get_tap_balances',
  description:
    'Get all Taproot Asset balances for a specific tapd or litd node. ' +
    'Returns a list of assets with their balances. ' +
    'Works with tapd nodes and litd nodes (which include integrated tapd).',
  inputSchema: {
    type: 'object',
    properties: {
      networkId: {
        type: 'number',
        description: 'ID of the network',
      },
      nodeName: {
        type: 'string',
        description: 'Name of the tapd or litd node to get balances from',
      },
    },
    required: ['networkId', 'nodeName'],
  },
};

/** The implementation for the get_tap_balances tool */
export const getTapBalancesTool = thunk<
  Record<string, never>,
  GetTapBalancesArgs,
  StoreInjections,
  RootModel,
  Promise<GetTapBalancesResult>
>(
  async (
    actions,
    args,
    { getStoreState, getStoreActions },
  ): Promise<GetTapBalancesResult> => {
    // Validate required parameters
    validateNetworkId(args.networkId);
    validateRequired(args.nodeName, 'Node name');

    info('MCP: Getting Taproot Asset balances:', args);

    // Find the network (networkById throws if not found)
    const network = getStoreState().network.networkById(args.networkId);

    // Find the tap node (can be tapd or litd)
    const node = findNode(network, args.nodeName, 'tap');

    // Get the balances
    await getStoreActions().tap.getBalances(node);

    // Get the balances from the state
    const balances = getStoreState().tap.nodes[node.name]?.balances || [];

    return { balances };
  },
);
