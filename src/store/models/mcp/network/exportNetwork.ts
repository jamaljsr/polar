import { info } from 'electron-log';
import { thunk } from 'easy-peasy';
import { Status } from 'shared/types';
import { RootModel } from 'store/models';
import { validateNetworkId, validateRequired } from 'store/models/mcp/helpers';
import { McpToolDefinition } from 'store/models/mcp/types';
import { StoreInjections } from 'types';
import { zipNetwork } from 'utils/network';

/** The arguments for the export_network_to_zip tool */
export interface ExportNetworkToZipArgs {
  networkId: number;
  outputPath: string;
}

/** The result of the export_network_to_zip tool */
export interface ExportNetworkToZipResult {
  success: boolean;
  outputPath: string;
  message: string;
}

/** The definition of the export_network_to_zip tool which will be provided to the LLM */
export const exportNetworkToZipDefinition: McpToolDefinition = {
  name: 'export_network_to_zip',
  description:
    'Exports a Lightning Network to a .polar.zip file. The network must be in Stopped or Error status. ' +
    'The exported file can be imported back into Polar using the import_network_from_zip tool.',
  inputSchema: {
    type: 'object',
    properties: {
      networkId: {
        type: 'number',
        description: 'ID of the network to export',
      },
      outputPath: {
        type: 'string',
        description: 'Absolute path where the .polar.zip file will be saved',
      },
    },
    required: ['networkId', 'outputPath'],
  },
};

/** The implementation for the export_network_to_zip tool */
export const exportNetworkToZipTool = thunk<
  Record<string, never>,
  ExportNetworkToZipArgs,
  StoreInjections,
  RootModel,
  Promise<ExportNetworkToZipResult>
>(async (actions, args, { getStoreState }): Promise<ExportNetworkToZipResult> => {
  // Validate required parameters
  validateNetworkId(args.networkId);
  validateRequired(args.outputPath, 'Output path');

  // Find the network (networkById throws if not found)
  const network = getStoreState().network.networkById(args.networkId);

  // Only export stopped/error networks
  if (![Status.Error, Status.Stopped].includes(network.status)) {
    throw new Error(
      `Network "${network.name}" cannot be exported. Network status must be Stopped or Error, but is ${network.status}`,
    );
  }

  info('MCP: Exporting network to zip:', args.outputPath);

  // Export the network using zipNetwork utility
  const activeChart = getStoreState().designer.allCharts[network.id];
  await zipNetwork(network, activeChart, args.outputPath);

  // Return the result
  return {
    success: true,
    outputPath: args.outputPath,
    message: `Network "${network.name}" exported successfully to ${args.outputPath}`,
  };
});
