import { thunk } from 'easy-peasy';
import { RootModel } from 'store/models';
import { validateNetworkId, validateRequired } from 'store/models/mcp/helpers';
import { McpToolDefinition } from 'store/models/mcp/types';
import { StoreInjections } from 'types';
import { findNode } from '../helpers';

export interface SyncTapUniverseArgs {
  networkId: number;
  nodeName: string;
  universeNodeName: string;
}

export interface SyncTapUniverseResult {
  syncedAssets: number;
}

export const syncTapUniverseDefinition: McpToolDefinition = {
  name: 'sync_tap_universe',
  description: 'Sync with Taproot Assets universe',
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
      universeNodeName: {
        type: 'string',
        description: 'The name of the tapd node to sync with',
      },
    },
    required: ['networkId', 'nodeName', 'universeNodeName'],
  },
};

export const syncTapUniverseTool = thunk<
  Record<string, never>,
  SyncTapUniverseArgs,
  StoreInjections,
  RootModel,
  Promise<SyncTapUniverseResult>
>(
  async (
    actions,
    args,
    { getStoreState, getStoreActions },
  ): Promise<SyncTapUniverseResult> => {
    validateNetworkId(args.networkId);
    validateRequired(args.nodeName, 'Node name');
    validateRequired(args.universeNodeName, 'Universe node name');

    const { networkId, nodeName, universeNodeName } = args;
    const network = getStoreState().network.networkById(networkId);
    const node = findNode(network, nodeName, 'tap');
    const universeNode = findNode(network, universeNodeName, 'tap');

    const port = universeNode.implementation === 'litd' ? 8443 : 10029;
    const hostname = `${universeNode.name}:${port}`;

    const syncedAssets = await getStoreActions().tap.syncUniverse({ node, hostname });
    return { syncedAssets };
  },
);
