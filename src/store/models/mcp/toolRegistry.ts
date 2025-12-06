import type { Actions } from 'easy-peasy';
import { getBitcoinWalletInfoDefinition } from './bitcoin/getBitcoinWalletInfo';
import { getBlockchainInfoDefinition } from './bitcoin/getBlockchainInfo';
import { getNewBitcoinAddressDefinition } from './bitcoin/getNewBitcoinAddress';
import { mineBlocksDefinition } from './bitcoin/mineBlocks';
import { sendBitcoinDefinition } from './bitcoin/sendBitcoin';
import { setAutoMineModeDefinition } from './bitcoin/setAutoMineMode';
import { closeTapChannelDefinition } from './lightning/asset-channels/closeTapChannel';
import { fundTapChannelDefinition } from './lightning/asset-channels/fundTapChannel';
import { createAssetInvoiceDefinition } from './lightning/asset-payments/createAssetInvoice';
import { getAssetsInChannelsDefinition } from './lightning/asset-payments/getAssetsInChannels';
import { payAssetInvoiceDefinition } from './lightning/asset-payments/payAssetInvoice';
import { closeChannelDefinition } from './lightning/channels/closeChannel';
import { listChannelsDefinition } from './lightning/channels/listChannels';
import { openChannelDefinition } from './lightning/channels/openChannel';
import { getNodeInfoDefinition } from './lightning/node-info/getNodeInfo';
import { createInvoiceDefinition } from './lightning/payments/createInvoice';
import { payInvoiceDefinition } from './lightning/payments/payInvoice';
import { depositFundsDefinition } from './lightning/wallet/depositFunds';
import { getWalletBalanceDefinition } from './lightning/wallet/getWalletBalance';
import { addLitdSessionDefinition } from './litd/addLitdSession';
import { listLitdSessionsDefinition } from './litd/listLitdSessions';
import { revokeLitdSessionDefinition } from './litd/revokeLitdSession';
import { addNodeDefinition } from './network/addNode';
import { createNetworkDefinition } from './network/createNetwork';
import { deleteNetworkDefinition } from './network/deleteNetwork';
import { exportNetworkToZipDefinition } from './network/exportNetwork';
import { getDefaultNodeCommandDefinition } from './network/getDefaultNodeCommand';
import { importNetworkFromZipDefinition } from './network/importNetwork';
import { listNetworksDefinition } from './network/listNetworks';
import { listNodeVersionsDefinition } from './network/listNodeVersions';
import { removeNodeDefinition } from './network/removeNode';
import { renameNetworkDefinition } from './network/renameNetwork';
import { renameNodeDefinition } from './network/renameNode';
import { restartNodeDefinition } from './network/restartNode';
import { setLightningBackendDefinition } from './network/setLightningBackend';
import { setTapBackendDefinition } from './network/setTapBackend';
import { startNetworkDefinition } from './network/startNetwork';
import { startNodeDefinition } from './network/startNode';
import { stopNetworkDefinition } from './network/stopNetwork';
import { stopNodeDefinition } from './network/stopNode';
import { updateNodeCommandDefinition } from './network/updateNodeCommand';
import { decodeTapAddressDefinition } from './tap/decodeTapAddress';
import { getTapAddressDefinition } from './tap/getTapAddress';
import { getTapBalancesDefinition } from './tap/getTapBalances';
import { listTapAssetsDefinition } from './tap/listTapAssets';
import { mintTapAssetDefinition } from './tap/mintTapAsset';
import { sendTapAssetDefinition } from './tap/sendTapAsset';
import { syncTapUniverseDefinition } from './tap/syncTapUniverse';
import { McpToolDefinition } from './types';

import type { RootModel } from 'store/models';

// These types ensure type-safety for the tool registry definitions and executors
type McpActions = Actions<RootModel>['mcp'];
type ToolActionKey = keyof McpActions;

type ToolExecutor<TAction extends ToolActionKey> = McpActions[TAction] extends (
  payload: infer TPayload,
) => infer TResult
  ? (mcpActions: McpActions, args: TPayload) => TResult
  : never;

type ToolRegistryEntryDefinition<TAction extends ToolActionKey = ToolActionKey> = {
  definition: McpToolDefinition;
  executor: ToolExecutor<TAction>;
};

// Helper function to call an action with the correct type
const callAction = <TAction extends ToolActionKey>(
  actionKey: TAction,
): ToolExecutor<TAction> =>
  ((mcpActions, args) =>
    (
      mcpActions[actionKey] as unknown as (
        payload: Parameters<McpActions[TAction]>[0],
      ) => ReturnType<McpActions[TAction]>
    )(args)) as ToolExecutor<TAction>;

/**
 * Central registry mapping tool names to their definitions and executors.
 * This replaces the large switch statement in the IPC handler and provides
 * a single source of truth for tool metadata.
 *
 * Uses definition.name as keys for type safety and to eliminate magic strings.
 */
export const TOOL_REGISTRY = {
  // Network tools (18)
  [listNetworksDefinition.name]: {
    definition: listNetworksDefinition,
    executor: callAction('listNetworks'),
  },
  [createNetworkDefinition.name]: {
    definition: createNetworkDefinition,
    executor: callAction('createNetwork'),
  },
  [importNetworkFromZipDefinition.name]: {
    definition: importNetworkFromZipDefinition,
    executor: callAction('importNetworkFromZip'),
  },
  [exportNetworkToZipDefinition.name]: {
    definition: exportNetworkToZipDefinition,
    executor: callAction('exportNetworkToZip'),
  },
  [startNetworkDefinition.name]: {
    definition: startNetworkDefinition,
    executor: callAction('startNetwork'),
  },
  [stopNetworkDefinition.name]: {
    definition: stopNetworkDefinition,
    executor: callAction('stopNetwork'),
  },
  [deleteNetworkDefinition.name]: {
    definition: deleteNetworkDefinition,
    executor: callAction('deleteNetwork'),
  },
  [renameNetworkDefinition.name]: {
    definition: renameNetworkDefinition,
    executor: callAction('renameNetwork'),
  },
  [setLightningBackendDefinition.name]: {
    definition: setLightningBackendDefinition,
    executor: callAction('setLightningBackend'),
  },
  [setTapBackendDefinition.name]: {
    definition: setTapBackendDefinition,
    executor: callAction('setTapBackend'),
  },
  [updateNodeCommandDefinition.name]: {
    definition: updateNodeCommandDefinition,
    executor: callAction('updateNodeCommand'),
  },
  [getDefaultNodeCommandDefinition.name]: {
    definition: getDefaultNodeCommandDefinition,
    executor: callAction('getDefaultNodeCommand'),
  },
  [listNodeVersionsDefinition.name]: {
    definition: listNodeVersionsDefinition,
    executor: callAction('listNodeVersions'),
  },
  [addNodeDefinition.name]: {
    definition: addNodeDefinition,
    executor: callAction('addNode'),
  },
  [startNodeDefinition.name]: {
    definition: startNodeDefinition,
    executor: callAction('startNode'),
  },
  [restartNodeDefinition.name]: {
    definition: restartNodeDefinition,
    executor: callAction('restartNode'),
  },
  [stopNodeDefinition.name]: {
    definition: stopNodeDefinition,
    executor: callAction('stopNode'),
  },
  [removeNodeDefinition.name]: {
    definition: removeNodeDefinition,
    executor: callAction('removeNode'),
  },
  [renameNodeDefinition.name]: {
    definition: renameNodeDefinition,
    executor: callAction('renameNode'),
  },

  // Bitcoin tools (6)
  [mineBlocksDefinition.name]: {
    definition: mineBlocksDefinition,
    executor: callAction('mineBlocks'),
  },
  [getBlockchainInfoDefinition.name]: {
    definition: getBlockchainInfoDefinition,
    executor: callAction('getBlockchainInfo'),
  },
  [getBitcoinWalletInfoDefinition.name]: {
    definition: getBitcoinWalletInfoDefinition,
    executor: callAction('getBitcoinWalletInfo'),
  },
  [sendBitcoinDefinition.name]: {
    definition: sendBitcoinDefinition,
    executor: callAction('sendBitcoin'),
  },
  [getNewBitcoinAddressDefinition.name]: {
    definition: getNewBitcoinAddressDefinition,
    executor: callAction('getNewBitcoinAddress'),
  },
  [setAutoMineModeDefinition.name]: {
    definition: setAutoMineModeDefinition,
    executor: callAction('setAutoMineMode'),
  },

  // Lightning tools (10)
  [openChannelDefinition.name]: {
    definition: openChannelDefinition,
    executor: callAction('openChannel'),
  },
  [closeChannelDefinition.name]: {
    definition: closeChannelDefinition,
    executor: callAction('closeChannel'),
  },
  [closeTapChannelDefinition.name]: {
    definition: closeTapChannelDefinition,
    executor: callAction('closeTapChannel'),
  },
  [fundTapChannelDefinition.name]: {
    definition: fundTapChannelDefinition,
    executor: callAction('fundTapChannel'),
  },
  [listChannelsDefinition.name]: {
    definition: listChannelsDefinition,
    executor: callAction('listChannels'),
  },
  [getNodeInfoDefinition.name]: {
    definition: getNodeInfoDefinition,
    executor: callAction('getNodeInfo'),
  },
  [getWalletBalanceDefinition.name]: {
    definition: getWalletBalanceDefinition,
    executor: callAction('getWalletBalance'),
  },
  [depositFundsDefinition.name]: {
    definition: depositFundsDefinition,
    executor: callAction('depositFunds'),
  },
  [createInvoiceDefinition.name]: {
    definition: createInvoiceDefinition,
    executor: callAction('createInvoice'),
  },
  [payInvoiceDefinition.name]: {
    definition: payInvoiceDefinition,
    executor: callAction('payInvoice'),
  },

  // Taproot Assets tools (9)
  [mintTapAssetDefinition.name]: {
    definition: mintTapAssetDefinition,
    executor: callAction('mintTapAsset'),
  },
  [listTapAssetsDefinition.name]: {
    definition: listTapAssetsDefinition,
    executor: callAction('listTapAssets'),
  },
  [sendTapAssetDefinition.name]: {
    definition: sendTapAssetDefinition,
    executor: callAction('sendTapAsset'),
  },
  [getTapBalancesDefinition.name]: {
    definition: getTapBalancesDefinition,
    executor: callAction('getTapBalances'),
  },
  [getTapAddressDefinition.name]: {
    definition: getTapAddressDefinition,
    executor: callAction('getTapAddress'),
  },
  [decodeTapAddressDefinition.name]: {
    definition: decodeTapAddressDefinition,
    executor: callAction('decodeTapAddress'),
  },
  [syncTapUniverseDefinition.name]: {
    definition: syncTapUniverseDefinition,
    executor: callAction('syncTapUniverse'),
  },
  [createAssetInvoiceDefinition.name]: {
    definition: createAssetInvoiceDefinition,
    executor: callAction('createAssetInvoice'),
  },
  [payAssetInvoiceDefinition.name]: {
    definition: payAssetInvoiceDefinition,
    executor: callAction('payAssetInvoice'),
  },
  [getAssetsInChannelsDefinition.name]: {
    definition: getAssetsInChannelsDefinition,
    executor: callAction('getAssetsInChannels'),
  },

  // LitD tools (3)
  [listLitdSessionsDefinition.name]: {
    definition: listLitdSessionsDefinition,
    executor: callAction('listLitdSessions'),
  },
  [addLitdSessionDefinition.name]: {
    definition: addLitdSessionDefinition,
    executor: callAction('addLitdSession'),
  },
  [revokeLitdSessionDefinition.name]: {
    definition: revokeLitdSessionDefinition,
    executor: callAction('revokeLitdSession'),
  },
} as const satisfies Record<string, ToolRegistryEntryDefinition>;

export type ToolName = Extract<keyof typeof TOOL_REGISTRY, string>;
export type ToolRegistryEntry = (typeof TOOL_REGISTRY)[ToolName];

const isToolName = (toolName: string): toolName is ToolName => toolName in TOOL_REGISTRY;

/**
 * Get all available tool definitions from the registry
 */
export const AVAILABLE_TOOLS = Object.values(TOOL_REGISTRY).map(
  entry => entry.definition,
);

/**
 * Get a tool entry by name, throwing an error if not found
 */
export function getToolEntry(toolName: string): ToolRegistryEntry {
  if (!isToolName(toolName)) {
    throw new Error(`Unknown tool: ${toolName}`);
  }
  return TOOL_REGISTRY[toolName];
}

/**
 * Export the list of tool definitions with shortened names
 */
export const tools = {
  listNetworks: listNetworksDefinition,
  createNetwork: createNetworkDefinition,
  importNetworkFromZip: importNetworkFromZipDefinition,
  exportNetworkToZip: exportNetworkToZipDefinition,
  startNetwork: startNetworkDefinition,
  stopNetwork: stopNetworkDefinition,
  deleteNetwork: deleteNetworkDefinition,
  renameNetwork: renameNetworkDefinition,
  addNode: addNodeDefinition,
  startNode: startNodeDefinition,
  restartNode: restartNodeDefinition,
  stopNode: stopNodeDefinition,
  removeNode: removeNodeDefinition,
  renameNode: renameNodeDefinition,
  setLightningBackend: setLightningBackendDefinition,
  setTapBackend: setTapBackendDefinition,
  updateNodeCommand: updateNodeCommandDefinition,
  getDefaultNodeCommand: getDefaultNodeCommandDefinition,
  listNodeVersions: listNodeVersionsDefinition,
  mineBlocks: mineBlocksDefinition,
  getBlockchainInfo: getBlockchainInfoDefinition,
  getBitcoinWalletInfo: getBitcoinWalletInfoDefinition,
  sendBitcoin: sendBitcoinDefinition,
  getNewBitcoinAddress: getNewBitcoinAddressDefinition,
  setAutoMineMode: setAutoMineModeDefinition,
  openChannel: openChannelDefinition,
  closeChannel: closeChannelDefinition,
  closeTapChannel: closeTapChannelDefinition,
  fundTapChannel: fundTapChannelDefinition,
  listChannels: listChannelsDefinition,
  getNodeInfo: getNodeInfoDefinition,
  getWalletBalance: getWalletBalanceDefinition,
  depositFunds: depositFundsDefinition,
  createInvoice: createInvoiceDefinition,
  payInvoice: payInvoiceDefinition,
  mintTapAsset: mintTapAssetDefinition,
  listTapAssets: listTapAssetsDefinition,
  sendTapAsset: sendTapAssetDefinition,
  getTapBalances: getTapBalancesDefinition,
  getTapAddress: getTapAddressDefinition,
  decodeTapAddress: decodeTapAddressDefinition,
  syncTapUniverse: syncTapUniverseDefinition,
  createAssetInvoice: createAssetInvoiceDefinition,
  payAssetInvoice: payAssetInvoiceDefinition,
  getAssetsInChannels: getAssetsInChannelsDefinition,
  listLitdSessions: listLitdSessionsDefinition,
  addLitdSession: addLitdSessionDefinition,
  revokeLitdSession: revokeLitdSessionDefinition,
};
