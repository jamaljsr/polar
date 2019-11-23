import { Channel, PendingChannel } from '@radar/lnrpc';
import { LightningNodeChannel } from 'lib/lightning/types';

export const mapOpenChannel = (chan: Channel): LightningNodeChannel => ({
  pending: false,
  uniqueId: chan.channelPoint.slice(-12),
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
  uniqueId: chan.channelPoint.slice(-12),
  channelPoint: chan.channelPoint,
  pubkey: chan.remoteNodePub,
  capacity: chan.capacity,
  localBalance: chan.localBalance,
  remoteBalance: chan.remoteBalance,
  status,
});
