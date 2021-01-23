import { Channel, PendingChannel } from '@jamaljsr/lnrpc';
import { LightningNodeChannel } from 'lib/lightning/types';

const txid = (channelPoint: string) => channelPoint.split(':')[0];

export const mapOpenChannel = (chan: Channel): LightningNodeChannel => ({
  pending: false,
  uniqueId: txid(chan.channelPoint).slice(-12),
  channelPoint: chan.channelPoint,
  pubkey: chan.remotePubkey,
  capacity: chan.capacity,
  localBalance: chan.localBalance,
  remoteBalance: chan.remoteBalance,
  status: 'Open',
});

export const mapPendingChannel = (status: LightningNodeChannel['status']) => (
  chan: PendingChannel,
): LightningNodeChannel => ({
  pending: true,
  uniqueId: txid(chan.channelPoint).slice(-12),
  channelPoint: chan.channelPoint,
  pubkey: chan.remoteNodePub,
  capacity: chan.capacity,
  localBalance: chan.localBalance,
  remoteBalance: chan.remoteBalance,
  status,
});
