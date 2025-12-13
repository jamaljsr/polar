import { info } from 'electron-log';
import { thunk } from 'easy-peasy';
import { BitcoinNode, LightningNode } from 'shared/types';
import { RootModel } from 'store/models';
import { findNode, validateNetworkId } from 'store/models/mcp/helpers';
import { McpToolDefinition } from 'store/models/mcp/types';
import { StoreInjections } from 'types';

/** The arguments for the get_new_bitcoin_address tool */
export interface GetNewBitcoinAddressArgs {
  networkId: number;
  nodeName?: string;
}

/** The result of the get_new_bitcoin_address tool */
export interface GetNewBitcoinAddressResult {
  success: boolean;
  message: string;
  networkId: number;
  nodeName: string;
  address: string;
  nodeType: 'bitcoin' | 'lightning';
}

/** The definition of the get_new_bitcoin_address tool which will be provided to the LLM */
export const getNewBitcoinAddressDefinition: McpToolDefinition = {
  name: 'get_new_bitcoin_address',
  description:
    'Generate new Bitcoin address for Lightning/Bitcoin nodes. This creates a new receiving address ' +
    'that can be used to receive on-chain Bitcoin payments.',
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
          'Name of the node to generate address for (optional, uses first available node if not specified)',
      },
    },
    required: ['networkId'],
  },
};

/** The implementation for the get_new_bitcoin_address tool */
export const getNewBitcoinAddressTool = thunk<
  Record<string, never>,
  GetNewBitcoinAddressArgs,
  StoreInjections,
  RootModel,
  Promise<GetNewBitcoinAddressResult>
>(async (actions, args, { getStoreState, injections }) => {
  // Validate required parameters
  validateNetworkId(args.networkId);

  info('MCP: Getting new Bitcoin address:', { ...args });

  // Find the network (networkById throws if not found)
  const network = getStoreState().network.networkById(args.networkId);

  // Find the node (can be Bitcoin or Lightning node)
  let node: BitcoinNode | LightningNode;
  let nodeType: 'bitcoin' | 'lightning';

  if (args.nodeName) {
    // Try to find as bitcoin node first, then lightning node
    try {
      node = findNode(network, args.nodeName, 'bitcoin');
      nodeType = 'bitcoin';
    } catch {
      node = findNode(network, args.nodeName, 'lightning');
      nodeType = 'lightning';
    }
  } else {
    // Use first available node (prefer Bitcoin nodes over Lightning nodes)
    if (network.nodes.bitcoin.length > 0) {
      node = findNode(network, undefined, 'bitcoin');
      nodeType = 'bitcoin';
    } else if (network.nodes.lightning.length > 0) {
      node = findNode(network, undefined, 'lightning');
      nodeType = 'lightning';
    } else {
      throw new Error('Network has no Bitcoin or Lightning nodes');
    }
  }

  let address: string;

  if (nodeType === 'bitcoin') {
    // For Bitcoin nodes, use the bitcoin service
    address = await injections.bitcoinFactory
      .getService(node as BitcoinNode)
      .getNewAddress(node as BitcoinNode);
  } else {
    // For Lightning nodes, use the lightning service
    const addressResult = await injections.lightningFactory
      .getService(node as LightningNode)
      .getNewAddress(node as LightningNode);
    // Lightning services return a LightningNodeAddress object with an address property
    address = addressResult.address;
  }

  return {
    success: true,
    message: `Generated new Bitcoin address for "${node.name}": ${address}`,
    networkId: args.networkId,
    nodeName: node.name,
    address,
    nodeType,
  };
});
