import { debug } from 'electron-log';
import * as LND from '@lightningpolar/lnd-api';
import { PendingChannel } from 'shared/lndDefaults';
import { LightningNodeChannel } from 'lib/lightning/types';
import { snakeKeysToCamel } from 'utils/objects';

const txid = (channelPoint: string) => channelPoint.split(':')[0];

export const mapOpenChannel = (chan: LND.Channel): LightningNodeChannel => {
  return {
    pending: false,
    uniqueId: txid(chan.channelPoint).slice(-12),
    channelPoint: chan.channelPoint,
    pubkey: chan.remotePubkey,
    capacity: chan.capacity,
    localBalance: chan.localBalance,
    remoteBalance: chan.remoteBalance,
    status: 'Open',
    isPrivate: chan.private,
    assets: parseCustomData(chan.chanId, chan.customChannelData),
  };
};

export const mapPendingChannel =
  (status: LightningNodeChannel['status']) =>
  (chan: PendingChannel): LightningNodeChannel => ({
    pending: true,
    uniqueId: txid(chan.channelPoint).slice(-12),
    channelPoint: chan.channelPoint,
    pubkey: chan.remoteNodePub,
    capacity: chan.capacity,
    localBalance: chan.localBalance,
    remoteBalance: chan.remoteBalance,
    status,
    isPrivate: false,
    assets: parseCustomData(chan.channelPoint, chan.customChannelData),
  });

/** The structure of the custom channel data JSON */

interface ChannelCustomDataUtxo {
  version: number;
  assetGenesis: {
    genesisPoint: string;
    name: string;
    metaHash: string;
    assetId: string;
  };
  amount: number;
  scriptKey: string;
  decimalDisplay: number;
}

export interface ChannelCustomDataAsset {
  assetId: string;
  amount: string;
}

interface ChannelCustomData {
  // This field is only present for tapd v0.5.x
  assets: [
    {
      assetUtxo: ChannelCustomDataUtxo;
      capacity: number;
      localBalance: number;
      remoteBalance: number;
    },
  ];
  // These fields are present for tapd v0.6.x and above
  fundingAssets: ChannelCustomDataUtxo[];
  localAssets: ChannelCustomDataAsset[];
  remoteAssets: ChannelCustomDataAsset[];
  outgoingHtlcs: ChannelCustomDataAsset[];
  incomingHtlcs: ChannelCustomDataAsset[];
  capacity: string;
  groupKey?: string;
  localBalance: string;
  remoteBalance: string;
  outgoingHtlcBalance: string;
  incomingHtlcBalance: string;
}

/**
 * The custom channel data field is returned from the RPC as a UInt8Array. It needs to be
 * converted to a string and then parsed as JSON to extract the assets data.
 */
const parseCustomData = (
  id: string,
  customChannelData: Buffer,
): LightningNodeChannel['assets'] => {
  if (!customChannelData || customChannelData.length === 0) return [];
  // customChannelData is actually a Uint8Array so we have to cast it
  const data = Buffer.from(customChannelData as unknown as Uint8Array).toString('utf8');
  try {
    const chanData = snakeKeysToCamel(JSON.parse(data)) as ChannelCustomData;
    if (chanData.assets) {
      debug(
        `Parsed customChannelData for channel ${id}:`,
        JSON.stringify(chanData, null, 2),
      );
      const assets = chanData.assets.map(asset => ({
        id: asset.assetUtxo?.assetGenesis?.assetId,
        name: asset.assetUtxo?.assetGenesis?.name,
        groupKey: chanData.groupKey,
        capacity: asset.capacity?.toString(),
        localBalance: asset.localBalance?.toString(),
        remoteBalance: asset.remoteBalance?.toString(),
      }));
      debug(`Parsed assets for channel ${id}:`, assets);
      return assets;
    }
    if (chanData.fundingAssets) {
      debug(
        `Parsed customChannelData for channel ${id}:`,
        JSON.stringify(chanData, null, 2),
      );
      const assets = chanData.fundingAssets.map(asset => ({
        id: asset.assetGenesis?.assetId,
        name: asset.assetGenesis?.name,
        groupKey: chanData.groupKey,
        capacity: asset.amount.toString(),
        localBalance: chanData.localAssets
          .reduce((acc, asset) => acc + Number(asset.amount), 0)
          .toString(),
        remoteBalance: chanData.remoteAssets
          .reduce((acc, asset) => acc + Number(asset.amount), 0)
          .toString(),
      }));
      debug(`Parsed assets for channel ${id}:`, assets);
      return assets;
    }
    debug(`No assets found in customChannelData for channel ${id}`);
    return [];
  } catch (e) {
    debug(`Failed to parse customChannelData for channel ${id}:`, data, e);
    return [];
  }
};
