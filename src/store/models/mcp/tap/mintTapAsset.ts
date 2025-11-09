import { info } from 'electron-log';
import { thunk } from 'easy-peasy';
import { TAP_ASSET_TYPE } from 'lib/tap/types';
import { RootModel } from 'store/models';
import {
  validateNetworkId,
  validatePositiveNumber,
  validateRequired,
} from 'store/models/mcp/helpers';
import { McpToolDefinition } from 'store/models/mcp/types';
import { StoreInjections } from 'types';
import { findNode } from '../helpers';

/** The arguments for the mint_tap_asset tool */
export interface MintTapAssetArgs {
  networkId: number;
  nodeName: string;
  assetType: 'normal' | 'collectible';
  name: string;
  amount: number;
  decimals?: number;
  enableEmission?: boolean;
  finalize?: boolean;
  autoFund?: boolean;
}

/** The result of the mint_tap_asset tool */
export interface MintTapAssetResult {
  success: boolean;
  message: string;
  networkId: number;
  nodeName: string;
  assetName: string;
  assetType: string;
  amount: number;
  batchKey: string;
}

/** The definition of the mint_tap_asset tool which will be provided to the LLM */
export const mintTapAssetDefinition: McpToolDefinition = {
  name: 'mint_tap_asset',
  description:
    'Mint a new Taproot Asset on a tapd or litd node. ' +
    'Creates a new asset with the specified parameters. ' +
    'For normal assets, you can specify an amount and decimals. ' +
    'For collectibles, the amount is always 1. ' +
    'Set finalize=true to automatically finalize the batch and mine blocks to confirm. ' +
    'Set autoFund=true to automatically fund the node with Bitcoin if needed. ' +
    'Works with tapd nodes and litd nodes (which include integrated tapd).',
  inputSchema: {
    type: 'object',
    properties: {
      networkId: {
        type: 'number',
        description: 'ID of the network',
      },
      nodeName: {
        type: 'string',
        description: 'Name of the tapd or litd node to mint the asset on',
      },
      assetType: {
        type: 'string',
        enum: ['normal', 'collectible'],
        description:
          'Type of asset: "normal" for fungible assets, "collectible" for NFTs',
      },
      name: {
        type: 'string',
        description: 'Name of the asset',
      },
      amount: {
        type: 'number',
        description: 'Amount to mint (ignored for collectibles, which are always 1)',
        minimum: 1,
      },
      decimals: {
        type: 'number',
        description:
          'Number of decimal places for the asset (default: 0, max: 8). Only for normal ' +
          'assets. The amount must be the total number of units in the supply, so 10000 ' +
          'amount with 2 decimals would be displayed as 100.00',
        minimum: 0,
        maximum: 8,
      },
      enableEmission: {
        type: 'boolean',
        description:
          'Whether to enable future emission for this asset (creates an asset group)',
      },
      finalize: {
        type: 'boolean',
        description:
          'Whether to finalize the batch immediately and mine blocks to confirm',
      },
      autoFund: {
        type: 'boolean',
        description: 'Whether to automatically fund the LND node with Bitcoin if needed',
      },
    },
    required: ['networkId', 'nodeName', 'assetType', 'name', 'amount'],
  },
};

/** The implementation for the mint_tap_asset tool */
export const mintTapAssetTool = thunk<
  Record<string, never>,
  MintTapAssetArgs,
  StoreInjections,
  RootModel,
  Promise<MintTapAssetResult>
>(
  async (
    actions,
    args,
    { getStoreState, getStoreActions },
  ): Promise<MintTapAssetResult> => {
    // Validate required parameters
    validateNetworkId(args.networkId);
    validateRequired(args.nodeName, 'Node name');
    validateRequired(args.assetType, 'Asset type');
    if (args.assetType !== 'normal' && args.assetType !== 'collectible') {
      throw new Error('Asset type must be "normal" or "collectible"');
    }
    validateRequired(args.name, 'Asset name');
    validatePositiveNumber(args.amount, 'Amount');

    // Validate optional parameters
    if (args.decimals != null && (args.decimals < 0 || args.decimals > 8)) {
      throw new Error('Decimals must be between 0 and 8');
    }

    info('MCP: Minting Taproot Asset:', args);

    // Find the network (networkById throws if not found)
    const network = getStoreState().network.networkById(args.networkId);

    // Find the tap node (can be tapd or litd)
    const node = findNode(network, args.nodeName, 'tap');

    // Convert asset type string to enum
    const assetTypeEnum =
      args.assetType === 'normal' ? TAP_ASSET_TYPE.NORMAL : TAP_ASSET_TYPE.COLLECTIBLE;

    // Mint the asset
    const result = await getStoreActions().tap.mintAsset({
      node,
      assetType: assetTypeEnum,
      name: args.name,
      amount: args.amount,
      decimals: args.decimals ?? 0,
      enableEmission: args.enableEmission ?? false,
      finalize: args.finalize ?? true,
      autoFund: args.autoFund ?? true,
    });

    return {
      success: true,
      message: `Minted ${args.assetType} asset "${args.name}" on node "${args.nodeName}"`,
      networkId: args.networkId,
      nodeName: args.nodeName,
      assetName: args.name,
      assetType: args.assetType,
      amount: args.assetType === 'collectible' ? 1 : args.amount,
      batchKey: result.pendingBatch?.batchKey || '',
    };
  },
);
