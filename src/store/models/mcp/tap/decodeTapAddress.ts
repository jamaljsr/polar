import { thunk } from 'easy-peasy';
import { RootModel } from 'store/models';
import { validateNetworkId, validateRequired } from 'store/models/mcp/helpers';
import { McpToolDefinition } from 'store/models/mcp/types';
import { StoreInjections } from 'types';
import { findNode } from '../helpers';

export interface DecodeTapAddressArgs {
  networkId: number;
  nodeName: string;
  address: string;
}

export interface DecodeTapAddressResult {
  address: string;
  assetId: string;
  amount: string;
  name?: string;
}

export const decodeTapAddressDefinition: McpToolDefinition = {
  name: 'decode_tap_address',
  description: 'Decode Taproot Asset address',
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
      address: {
        type: 'string',
        description: 'The Taproot Asset address to decode',
      },
    },
    required: ['networkId', 'nodeName', 'address'],
  },
};

export const decodeTapAddressTool = thunk<
  Record<string, never>,
  DecodeTapAddressArgs,
  StoreInjections,
  RootModel,
  Promise<DecodeTapAddressResult>
>(
  async (
    actions,
    args,
    { getStoreState, getStoreActions },
  ): Promise<DecodeTapAddressResult> => {
    validateNetworkId(args.networkId);
    validateRequired(args.nodeName, 'Node name');
    validateRequired(args.address, 'Address');

    const { networkId, nodeName, address } = args;
    const network = getStoreState().network.networkById(networkId);
    const node = findNode(network, nodeName, 'tap');
    const result = await getStoreActions().tap.decodeAddress({ node, address });

    return {
      address: result.encoded,
      assetId: result.id,
      amount: result.amount,
      name: result.name,
    };
  },
);
