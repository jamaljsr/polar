import { thunk } from 'easy-peasy';
import { RootModel } from 'store/models';
import { McpToolDefinition } from 'store/models/mcp/types';
import { Network, StoreInjections } from 'types';

/** The result of the list_networks tool */
interface ListNetworksResult {
  networks: Network[];
}

/** The definition of the list_networks tool which will be provided to the LLM */
export const listNetworksDefinition: McpToolDefinition = {
  name: 'list_networks',
  description:
    'Lists all Lightning Networks in Polar with their configurations and status',
  inputSchema: {
    type: 'object',
    properties: {},
    required: [],
  },
};

/** The implementation for the list_networks tool */
export const listNetworksTool = thunk<
  Record<string, never>,
  void,
  StoreInjections,
  RootModel,
  ListNetworksResult
>((actions, payload, { getStoreState }) => {
  const { networks } = getStoreState().network;
  return { networks };
});
