import { info } from 'electron-log';
import { thunk } from 'easy-peasy';
import { LightningNodeChannel } from 'lib/lightning/types';
import { RootModel } from 'store/models';
import { findNode, validateNetworkId, validateRequired } from 'store/models/mcp/helpers';
import { McpToolDefinition } from 'store/models/mcp/types';
import { StoreInjections } from 'types';

/** The arguments for the list_channels tool */
export interface ListChannelsArgs {
  networkId: number;
  nodeName: string;
}

/** The result of the list_channels tool */
export interface ListChannelsResult {
  success: boolean;
  message: string;
  networkId: number;
  nodeName: string;
  channels: LightningNodeChannel[];
}

/** The definition of the list_channels tool which will be provided to the LLM */
export const listChannelsDefinition: McpToolDefinition = {
  name: 'list_channels',
  description:
    'List all Lightning Network channels for a specific node, including both channels initiated by the node ' +
    'and channels where the node is the peer. Returns information about each channel including status, ' +
    'balances, capacity, and whether the channel is pending, open, or closed. This is useful for checking ' +
    'channel connectivity and balance distribution.',
  inputSchema: {
    type: 'object',
    properties: {
      networkId: {
        type: 'number',
        description: 'ID of the network',
      },
      nodeName: {
        type: 'string',
        description: 'Name of the Lightning node to list channels for',
      },
    },
    required: ['networkId', 'nodeName'],
  },
};

/** The implementation for the list_channels tool */
export const listChannelsTool = thunk<
  Record<string, never>,
  ListChannelsArgs,
  StoreInjections,
  RootModel,
  Promise<ListChannelsResult>
>(
  async (
    actions,
    args,
    { getStoreState, getStoreActions },
  ): Promise<ListChannelsResult> => {
    // Validate required parameters
    validateNetworkId(args.networkId);
    validateRequired(args.nodeName, 'Node name');

    info('MCP: Listing channels:', args);

    // Find the network (networkById throws if not found)
    const network = getStoreState().network.networkById(args.networkId);

    // Find the Lightning node
    const node = findNode(network, args.nodeName, 'lightning');

    // Get the target node's info to obtain its pubkey
    await getStoreActions().lightning.getInfo(node);
    const nodeInfo = getStoreState().lightning.nodes[node.name]?.info;
    if (!nodeInfo) {
      throw new Error(`Unable to retrieve info for node "${args.nodeName}"`);
    }
    const targetPubkey = nodeInfo.pubkey;

    // Fetch channels from all lightning nodes in the network to find channels where target node is the peer
    const allChannels: LightningNodeChannel[] = [];
    await Promise.all(
      network.nodes.lightning.map(async lightningNode => {
        try {
          await getStoreActions().lightning.getInfo(lightningNode);
          await getStoreActions().lightning.getChannels(lightningNode);
          const nodeState = getStoreState().lightning.nodes[lightningNode.name];
          const channels = nodeState?.channels || [];
          if (lightningNode.name === node.name) {
            // channels opened by the target node
            allChannels.push(...channels);
          } else {
            // channels opened by other nodes to the target node
            const peerInfo = getStoreState().lightning.nodes[lightningNode.name]?.info;
            if (!peerInfo) {
              throw new Error(`Unable to retrieve info for node "${lightningNode.name}"`);
            }
            const peerPubkey = peerInfo.pubkey;
            const peerChannels = channels
              .filter(channel => channel.pubkey === targetPubkey)
              .map(c => ({
                ...c,
                // set the pubkey to the peer's pubkey
                pubkey: peerPubkey,
                // swap the local and remote balances because we are looking at the
                // channel from the other node's perspective
                localBalance: c.remoteBalance,
                remoteBalance: c.localBalance,
              }));
            allChannels.push(...peerChannels);
          }
        } catch (error) {
          // Continue if a node fails, but log the error
          info(`Failed to fetch channels for node ${lightningNode.name}:`, error);
        }
      }),
    );

    return {
      success: true,
      message: `Found ${allChannels.length} channel${
        allChannels.length === 1 ? '' : 's'
      } for node "${args.nodeName}"`,
      networkId: args.networkId,
      nodeName: args.nodeName,
      channels: allChannels,
    };
  },
);
