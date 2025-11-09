import { thunk } from 'easy-peasy';
import { TapAddress } from 'lib/tap/types';
import { RootModel } from 'store/models';
import { validateNetworkId, validateRequired } from 'store/models/mcp/helpers';
import { McpToolDefinition } from 'store/models/mcp/types';
import { StoreInjections } from 'types';
import { findNode } from '../helpers';

export interface GetTapAddressArgs {
  networkId: number;
  nodeName: string;
  assetId: string;
  amount: string;
}

export const getTapAddressDefinition: McpToolDefinition = {
  name: 'get_tap_address',
  description: 'Generate Taproot Asset address',
  inputSchema: {
    type: 'object',
    properties: {
      networkId: {
        type: 'number',
        description: 'ID of the network',
      },
      nodeName: {
        type: 'string',
        description: 'Name of the tapd or litd node',
      },
      assetId: {
        type: 'string',
        description: 'The asset ID to create an address for',
      },
      amount: {
        type: 'string',
        description: 'The amount of the asset to send',
      },
    },
    required: ['networkId', 'nodeName', 'assetId', 'amount'],
  },
};

export const getTapAddressTool = thunk<
  Record<string, never>,
  GetTapAddressArgs,
  StoreInjections,
  RootModel,
  Promise<TapAddress>
>(async (actions, args, { getStoreState, getStoreActions }): Promise<TapAddress> => {
  validateNetworkId(args.networkId);
  validateRequired(args.nodeName, 'Node name');
  validateRequired(args.assetId, 'Asset ID');
  validateRequired(args.amount, 'Amount');

  const { networkId, nodeName, assetId, amount } = args;
  const network = getStoreState().network.networkById(networkId);
  const node = findNode(network, nodeName, 'tap');
  const result = await getStoreActions().tap.getNewAddress({ node, assetId, amount });
  return result;
});
