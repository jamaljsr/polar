import { thunk, Thunk } from 'easy-peasy';
import { NodeImplementation } from 'shared/types';
import { RootModel } from 'store/models';
import { McpToolDefinition } from 'store/models/mcp/types';
import { StoreInjections } from 'types';
import { defaultRepoState } from 'utils/constants';

/** The arguments for the list_node_versions tool */
export interface ListNodeVersionsArgs {
  implementation?: NodeImplementation;
}

/** The result of the list_node_versions tool */
export interface ListNodeVersionsResult {
  versions: Record<NodeImplementation, string[]>;
  latest: Record<NodeImplementation, string>;
  compatibility: Record<NodeImplementation, Record<string, string> | undefined>;
  message: string;
}

/** The definition of the list_node_versions tool which will be provided to the LLM */
export const listNodeVersionsDefinition: McpToolDefinition = {
  name: 'list_node_versions',
  description:
    'Lists all supported versions for node implementations included in Polar ' +
    'and the compatibility requirements for each version. The compatibility requirements ' +
    'are a map of version to the minimum version that is compatible with it.',
  inputSchema: {
    type: 'object',
    properties: {
      implementation: {
        type: 'string',
        enum: ['bitcoind', 'LND', 'c-lightning', 'eclair', 'litd', 'tapd'],
        description:
          'Filter to show versions for a specific implementation only (optional)',
      },
    },
  },
};

/** The implementation for the list_node_versions tool */
export const listNodeVersionsTool: Thunk<
  Record<string, never>,
  ListNodeVersionsArgs,
  StoreInjections,
  RootModel,
  Promise<ListNodeVersionsResult>
> = thunk(async (actions, args): Promise<ListNodeVersionsResult> => {
  const { images } = defaultRepoState;

  const allImplementations: NodeImplementation[] = [
    'bitcoind',
    'LND',
    'c-lightning',
    'eclair',
    'litd',
    'tapd',
    'btcd',
  ];

  const implementations = args.implementation
    ? [args.implementation]
    : allImplementations;

  const versions: Record<NodeImplementation, string[]> = {} as Record<
    NodeImplementation,
    string[]
  >;
  const latest: Record<NodeImplementation, string> = {} as Record<
    NodeImplementation,
    string
  >;
  const compatibility: Record<NodeImplementation, Record<string, string> | undefined> =
    {} as Record<NodeImplementation, Record<string, string> | undefined>;

  implementations.forEach(impl => {
    const image = images[impl];
    versions[impl] = image.versions;
    latest[impl] = image.latest;
    compatibility[impl] = image.compatibility;
  });

  const result: ListNodeVersionsResult = {
    versions,
    latest,
    compatibility,
    message: args.implementation
      ? `Available versions for ${args.implementation}`
      : 'All supported node versions in Polar',
  };

  return result;
});
