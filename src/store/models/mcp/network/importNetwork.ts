import { info } from 'electron-log';
import { existsSync } from 'fs';
import { thunk } from 'easy-peasy';
import { RootModel } from 'store/models';
import { validateRequired } from 'store/models/mcp/helpers';
import { McpToolDefinition } from 'store/models/mcp/types';
import { Network, StoreInjections } from 'types';

/** The arguments for the import_network_from_zip tool */
export interface ImportNetworkFromZipArgs {
  path: string;
}

/** The result of the import_network_from_zip tool */
export interface ImportNetworkFromZipResult {
  success: boolean;
  network: Network;
  message: string;
}

/** The definition of the import_network_from_zip tool which will be provided to the LLM */
export const importNetworkFromZipDefinition: McpToolDefinition = {
  name: 'import_network_from_zip',
  description:
    'Imports a Lightning Network from a .polar.zip file that was previously exported from Polar. ' +
    'The zip file must exist at the specified path. Returns the imported network summary.',
  inputSchema: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'Absolute path to the .polar.zip file to import',
      },
    },
    required: ['path'],
  },
};

/** The implementation for the import_network_from_zip tool */
export const importNetworkFromZipTool = thunk<
  Record<string, never>,
  ImportNetworkFromZipArgs,
  StoreInjections,
  RootModel,
  Promise<ImportNetworkFromZipResult>
>(async (actions, args, { getStoreActions }): Promise<ImportNetworkFromZipResult> => {
  // Validate required parameters
  validateRequired(args.path, 'Path to zip file');

  // Validate file exists
  if (!existsSync(args.path)) {
    throw new Error(`Zip file does not exist at path: ${args.path}`);
  }

  info('MCP: Importing network from zip:', args.path);

  // Import the network using the network store action
  const network = await getStoreActions().network.importNetwork(args.path);

  // Return the network info
  return {
    success: true,
    network,
    message: `Network "${network.name}" imported successfully`,
  };
});
