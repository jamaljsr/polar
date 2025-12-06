import { getBitcoinWalletInfoTool } from './bitcoin/getBitcoinWalletInfo';
import { getBlockchainInfoTool } from './bitcoin/getBlockchainInfo';
import { getNewBitcoinAddressTool } from './bitcoin/getNewBitcoinAddress';
import { mineBlocksTool } from './bitcoin/mineBlocks';
import { sendBitcoinTool } from './bitcoin/sendBitcoin';
import { setAutoMineModeTool } from './bitcoin/setAutoMineMode';
import { handleToolExecution, setupIpcListener } from './ipc';
import { closeTapChannelTool } from './lightning/asset-channels/closeTapChannel';
import { fundTapChannelTool } from './lightning/asset-channels/fundTapChannel';
import { createAssetInvoiceTool } from './lightning/asset-payments/createAssetInvoice';
import { getAssetsInChannelsTool } from './lightning/asset-payments/getAssetsInChannels';
import { payAssetInvoiceTool } from './lightning/asset-payments/payAssetInvoice';
import { closeChannelTool } from './lightning/channels/closeChannel';
import { listChannelsTool } from './lightning/channels/listChannels';
import { openChannelTool } from './lightning/channels/openChannel';
import { getNodeInfoTool } from './lightning/node-info/getNodeInfo';
import { createInvoiceTool } from './lightning/payments/createInvoice';
import { payInvoiceTool } from './lightning/payments/payInvoice';
import { depositFundsTool } from './lightning/wallet/depositFunds';
import { getWalletBalanceTool } from './lightning/wallet/getWalletBalance';
import { addLitdSessionTool } from './litd/addLitdSession';
import { listLitdSessionsTool } from './litd/listLitdSessions';
import { revokeLitdSessionTool } from './litd/revokeLitdSession';
import { addNodeTool } from './network/addNode';
import { createNetworkTool } from './network/createNetwork';
import { deleteNetworkTool } from './network/deleteNetwork';
import { exportNetworkToZipTool } from './network/exportNetwork';
import { getDefaultNodeCommandTool } from './network/getDefaultNodeCommand';
import { importNetworkFromZipTool } from './network/importNetwork';
import { listNetworksTool } from './network/listNetworks';
import { listNodeVersionsTool } from './network/listNodeVersions';
import { removeNodeTool } from './network/removeNode';
import { renameNetworkTool } from './network/renameNetwork';
import { renameNodeTool } from './network/renameNode';
import { restartNodeTool } from './network/restartNode';
import { setLightningBackendTool } from './network/setLightningBackend';
import { setTapBackendTool } from './network/setTapBackend';
import { startNetworkTool } from './network/startNetwork';
import { startNodeTool } from './network/startNode';
import { stopNetworkTool } from './network/stopNetwork';
import { stopNodeTool } from './network/stopNode';
import { updateNodeCommandTool } from './network/updateNodeCommand';
import { decodeTapAddressTool } from './tap/decodeTapAddress';
import { getTapAddressTool } from './tap/getTapAddress';
import { getTapBalancesTool } from './tap/getTapBalances';
import { listTapAssetsTool } from './tap/listTapAssets';
import { mintTapAssetTool } from './tap/mintTapAsset';
import { sendTapAssetTool } from './tap/sendTapAsset';
import { syncTapUniverseTool } from './tap/syncTapUniverse';

export interface McpModel {
  // Tool implementations
  listNetworks: typeof listNetworksTool;
  createNetwork: typeof createNetworkTool;
  importNetworkFromZip: typeof importNetworkFromZipTool;
  exportNetworkToZip: typeof exportNetworkToZipTool;
  startNetwork: typeof startNetworkTool;
  stopNetwork: typeof stopNetworkTool;
  deleteNetwork: typeof deleteNetworkTool;
  renameNetwork: typeof renameNetworkTool;
  addNode: typeof addNodeTool;
  startNode: typeof startNodeTool;
  restartNode: typeof restartNodeTool;
  stopNode: typeof stopNodeTool;
  removeNode: typeof removeNodeTool;
  renameNode: typeof renameNodeTool;
  setLightningBackend: typeof setLightningBackendTool;
  setTapBackend: typeof setTapBackendTool;
  updateNodeCommand: typeof updateNodeCommandTool;
  getDefaultNodeCommand: typeof getDefaultNodeCommandTool;
  listNodeVersions: typeof listNodeVersionsTool;
  mineBlocks: typeof mineBlocksTool;
  getBlockchainInfo: typeof getBlockchainInfoTool;
  getBitcoinWalletInfo: typeof getBitcoinWalletInfoTool;
  sendBitcoin: typeof sendBitcoinTool;
  getNewBitcoinAddress: typeof getNewBitcoinAddressTool;
  setAutoMineMode: typeof setAutoMineModeTool;
  openChannel: typeof openChannelTool;
  closeChannel: typeof closeChannelTool;
  closeTapChannel: typeof closeTapChannelTool;
  fundTapChannel: typeof fundTapChannelTool;
  listChannels: typeof listChannelsTool;
  getNodeInfo: typeof getNodeInfoTool;
  getWalletBalance: typeof getWalletBalanceTool;
  depositFunds: typeof depositFundsTool;
  createInvoice: typeof createInvoiceTool;
  payInvoice: typeof payInvoiceTool;
  mintTapAsset: typeof mintTapAssetTool;
  listTapAssets: typeof listTapAssetsTool;
  sendTapAsset: typeof sendTapAssetTool;
  getTapBalances: typeof getTapBalancesTool;
  getTapAddress: typeof getTapAddressTool;
  decodeTapAddress: typeof decodeTapAddressTool;
  syncTapUniverse: typeof syncTapUniverseTool;
  createAssetInvoice: typeof createAssetInvoiceTool;
  payAssetInvoice: typeof payAssetInvoiceTool;
  getAssetsInChannels: typeof getAssetsInChannelsTool;
  listLitdSessions: typeof listLitdSessionsTool;
  addLitdSession: typeof addLitdSessionTool;
  revokeLitdSession: typeof revokeLitdSessionTool;

  // IPC handling
  handleToolExecution: typeof handleToolExecution;
  setupIpcListener: typeof setupIpcListener;
}

const mcpModel: McpModel = {
  // Network tools
  listNetworks: listNetworksTool,
  createNetwork: createNetworkTool,
  importNetworkFromZip: importNetworkFromZipTool,
  exportNetworkToZip: exportNetworkToZipTool,
  startNetwork: startNetworkTool,
  stopNetwork: stopNetworkTool,
  deleteNetwork: deleteNetworkTool,
  renameNetwork: renameNetworkTool,
  addNode: addNodeTool,
  startNode: startNodeTool,
  restartNode: restartNodeTool,
  stopNode: stopNodeTool,
  removeNode: removeNodeTool,
  renameNode: renameNodeTool,
  setLightningBackend: setLightningBackendTool,
  setTapBackend: setTapBackendTool,
  updateNodeCommand: updateNodeCommandTool,
  getDefaultNodeCommand: getDefaultNodeCommandTool,
  listNodeVersions: listNodeVersionsTool,

  // Bitcoin tools
  mineBlocks: mineBlocksTool,
  getBlockchainInfo: getBlockchainInfoTool,
  getBitcoinWalletInfo: getBitcoinWalletInfoTool,
  sendBitcoin: sendBitcoinTool,
  getNewBitcoinAddress: getNewBitcoinAddressTool,
  setAutoMineMode: setAutoMineModeTool,

  // Lightning tools
  openChannel: openChannelTool,
  closeChannel: closeChannelTool,
  closeTapChannel: closeTapChannelTool,
  fundTapChannel: fundTapChannelTool,
  listChannels: listChannelsTool,
  getNodeInfo: getNodeInfoTool,
  getWalletBalance: getWalletBalanceTool,
  depositFunds: depositFundsTool,
  createInvoice: createInvoiceTool,
  payInvoice: payInvoiceTool,

  // Taproot Assets tools
  mintTapAsset: mintTapAssetTool,
  listTapAssets: listTapAssetsTool,
  sendTapAsset: sendTapAssetTool,
  getTapBalances: getTapBalancesTool,
  getTapAddress: getTapAddressTool,
  decodeTapAddress: decodeTapAddressTool,
  syncTapUniverse: syncTapUniverseTool,
  createAssetInvoice: createAssetInvoiceTool,
  payAssetInvoice: payAssetInvoiceTool,
  getAssetsInChannels: getAssetsInChannelsTool,
  listLitdSessions: listLitdSessionsTool,
  addLitdSession: addLitdSessionTool,
  revokeLitdSession: revokeLitdSessionTool,

  // IPC handlers
  handleToolExecution,
  setupIpcListener,
};

export default mcpModel;
