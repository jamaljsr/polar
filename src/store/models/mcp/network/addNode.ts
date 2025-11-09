import { info } from 'electron-log';
import { thunk, Thunk } from 'easy-peasy';
import { CommonNode, NodeImplementation, Status } from 'shared/types';
import { RootModel } from 'store/models';
import { validateNetworkId, validateRequired } from 'store/models/mcp/helpers';
import { McpToolDefinition } from 'store/models/mcp/types';
import { StoreInjections } from 'types';
import { initChartFromNetwork } from 'utils/chart';
import { defaultRepoState } from 'utils/constants';

/** The arguments for the add_node tool */
export interface AddNodeArgs {
  networkId: number;
  implementation: NodeImplementation;
  version?: string;
}

/** The result of the add_node tool */
export interface AddNodeResult {
  success: boolean;
  node: CommonNode;
  message: string;
}

/** The definition of the add_node tool which will be provided to the LLM */
export const addNodeDefinition: McpToolDefinition = {
  name: 'add_node',
  description:
    'Adds a Bitcoin Core or Lightning Network node to an existing Polar network. ' +
    'Supports Bitcoin Core (bitcoind), LND, c-lightning, eclair, and litd (Lightning Terminal) implementations. ' +
    'If the network is started, the node will be automatically started as well.',
  inputSchema: {
    type: 'object',
    properties: {
      networkId: {
        type: 'number',
        description: 'ID of the network to add the node to',
      },
      implementation: {
        type: 'string',
        enum: Object.keys(defaultRepoState.images),
        description: 'Node implementation to use',
      },
      version: {
        type: 'string',
        description:
          'Version of the implementation (optional, uses latest if not specified).' +
          ' Use the list_node_versions tool to see supported versions.',
      },
    },
    required: ['networkId', 'implementation'],
  },
};

/** The implementation for the add_node tool */
export const addNodeTool: Thunk<
  Record<string, never>,
  AddNodeArgs,
  StoreInjections,
  RootModel,
  Promise<AddNodeResult>
> = thunk(
  async (actions, args, { getStoreState, getStoreActions }): Promise<AddNodeResult> => {
    // Validate required parameters
    validateNetworkId(args.networkId);
    validateRequired(args.implementation, 'Implementation');

    // Validate implementation is supported
    const supportedImplementations = Object.keys(defaultRepoState.images);
    if (!supportedImplementations.includes(args.implementation)) {
      throw new Error(
        `Unsupported implementation '${
          args.implementation
        }'. Supported: ${supportedImplementations.join(', ')}`,
      );
    }

    // Check if network exists
    const { networks } = getStoreState().network;
    const network = networks.find(n => n.id === args.networkId);
    if (!network) {
      throw new Error(`Network with ID ${args.networkId} not found`);
    }

    // Validate version if provided
    if (args.version) {
      const supportedVersions = defaultRepoState.images[args.implementation].versions;
      if (!supportedVersions.includes(args.version)) {
        throw new Error(
          `Version '${args.version}' is not supported for ${
            args.implementation
          }. Supported versions: ${supportedVersions.join(', ')}`,
        );
      }
    }

    info('MCP: Adding node to network:', args);

    // Add the node using the network store action
    const node = await getStoreActions().network.addNode({
      id: args.networkId,
      type: args.implementation,
      version: args.version || defaultRepoState.images[args.implementation].latest,
    });

    const chart = initChartFromNetwork(network);
    getStoreActions().designer.setChart({ id: args.networkId, chart });
    getStoreActions().designer.setActiveId(args.networkId);

    if (network.status === Status.Started) {
      await getStoreActions().network.toggleNode(node);
      node.status = Status.Started;
    }

    // Return the node info
    const implementationName =
      args.implementation === 'bitcoind' ? 'Bitcoin Core' : args.implementation;
    return {
      success: true,
      node,
      message: `${implementationName} node "${node.name}" added to network "${network.name}" successfully`,
    };
  },
);
