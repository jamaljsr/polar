import { info } from 'electron-log';
import { thunk, Thunk } from 'easy-peasy';
import { BitcoinNode, CommonNode, LightningNode, TapNode } from 'shared/types';
import { RootModel } from 'store/models';
import { validateNetworkId, validateRequired } from 'store/models/mcp/helpers';
import { McpToolDefinition } from 'store/models/mcp/types';
import { StoreInjections } from 'types';

/** The arguments for the remove_node tool */
export interface RemoveNodeArgs {
  networkId: number;
  nodeName: string;
}

/** The result of the remove_node tool */
export interface RemoveNodeResult {
  success: boolean;
  message: string;
}

/** The definition of the remove_node tool which will be provided to the LLM */
export const removeNodeDefinition: McpToolDefinition = {
  name: 'remove_node',
  description:
    'Removes a node from an existing Polar network. This will permanently delete ' +
    'the node and all its data. Supports removing Lightning nodes (LND, c-lightning, ' +
    'eclair, litd), Bitcoin nodes (bitcoind), and Taproot Asset nodes (tapd). ' +
    'If the network is running, the node will be stopped before removal.',
  inputSchema: {
    type: 'object',
    properties: {
      networkId: {
        type: 'number',
        description: 'ID of the network containing the node to remove',
      },
      nodeName: {
        type: 'string',
        description: 'Name of the node to remove from the network',
      },
    },
    required: ['networkId', 'nodeName'],
  },
};

/** The implementation for the remove_node tool */
export const removeNodeTool: Thunk<
  Record<string, never>,
  RemoveNodeArgs,
  StoreInjections,
  RootModel,
  Promise<RemoveNodeResult>
> = thunk(
  async (
    actions,
    args,
    { getStoreState, getStoreActions },
  ): Promise<RemoveNodeResult> => {
    // Validate required parameters
    validateNetworkId(args.networkId);
    validateRequired(args.nodeName, 'Node name');

    // Check if network exists
    const { networks } = getStoreState().network;
    const network = networks.find(n => n.id === args.networkId);
    if (!network) {
      throw new Error(`Network with ID ${args.networkId} not found`);
    }

    // Find the node in the network
    const allNodes: CommonNode[] = [
      ...network.nodes.lightning,
      ...network.nodes.bitcoin,
      ...network.nodes.tap,
    ];
    const nodeToRemove = allNodes.find(n => n.name === args.nodeName);
    if (!nodeToRemove) {
      throw new Error(
        `Node "${args.nodeName}" not found in network "${network.name}". ` +
          `Available nodes: ${allNodes.map(n => n.name).join(', ')}`,
      );
    }

    info('MCP: Removing node from network:', args);

    // Call the appropriate remove method based on node type
    switch (nodeToRemove.type) {
      case 'lightning':
        await getStoreActions().network.removeLightningNode({
          node: nodeToRemove as LightningNode,
        });
        break;
      case 'bitcoin':
        await getStoreActions().network.removeBitcoinNode({
          node: nodeToRemove as BitcoinNode,
        });
        break;
      case 'tap':
        await getStoreActions().network.removeTapNode({
          node: nodeToRemove as TapNode,
        });
        break;
      default:
        throw new Error(`Unsupported node type: ${(nodeToRemove as any).type}`);
    }

    // Return success message
    const nodeTypeName =
      nodeToRemove.type === 'bitcoin'
        ? 'Bitcoin'
        : nodeToRemove.type === 'tap'
        ? 'Taproot Asset'
        : 'Lightning';
    return {
      success: true,
      message: `${nodeTypeName} node "${args.nodeName}" removed from network "${network.name}" successfully`,
    };
  },
);
