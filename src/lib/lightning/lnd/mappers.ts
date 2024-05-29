import { debug } from 'electron-log';
import * as LND from '@lightningpolar/lnd-api';
import { PendingChannel } from 'shared/lndDefaults';
import { LightningNodeChannel } from 'lib/lightning/types';

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
    assets: parseCustomData(chan),
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
  });

/** The structure of the custom channel data JSON */
interface ChannelCustomData {
  assets: [
    {
      asset_utxo: {
        version: 1;
        asset_genesis: {
          genesis_point: string;
          name: string;
          meta_hash: string;
          asset_id: string;
        };
        amount: number;
        script_key: string;
      };
      capacity: number;
      local_balance: number;
      remote_balance: number;
    },
  ];
}

/**
 * The custom channel data field is returned from the RPC as a UInt8Array. It needs to be
 * converted to a string and then parsed as JSON to extract the assets data.
 */
const parseCustomData = (chan: LND.Channel): LightningNodeChannel['assets'] => {
  const data = Buffer.from(chan.customChannelData).toString('utf8');
  try {
    const chanData = JSON.parse(data) as ChannelCustomData;
    if (!chanData.assets) return undefined;
    return chanData.assets.map(asset => ({
      id: asset.asset_utxo.asset_genesis.asset_id,
      name: asset.asset_utxo.asset_genesis.name,
      capacity: asset.capacity.toString(),
      localBalance: asset.local_balance.toString(),
      remoteBalance: asset.remote_balance.toString(),
    }));
  } catch (e) {
    debug(`Failed to parse customChannelData for channel ${chan.chanId}:` + data, e);
  }
};
