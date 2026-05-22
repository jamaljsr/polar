import * as PLN from 'lib/lightning/types';
import { LdkChannel } from './types';

export const mapChannelStatus = (
  channel: LdkChannel,
): PLN.LightningNodeChannel['status'] => {
  if (!channel.is_channel_ready) {
    return 'Opening';
  }
  if (channel.is_usable) {
    return 'Open';
  }
  if (channel.funding_txo) {
    return 'Closing';
  }
  return 'Closed';
};

export const mapChannel = (channel: LdkChannel): PLN.LightningNodeChannel => {
  const capacity = Number(channel.channel_value_sats || 0);
  const local = Math.floor(Number(channel.outbound_capacity_msat || 0) / 1000);
  const remote = Math.floor(Number(channel.inbound_capacity_msat || 0) / 1000);
  const channelPoint = channel.funding_txo
    ? `${channel.funding_txo.txid}:${channel.funding_txo.vout}`
    : channel.channel_id;

  return {
    pending: !channel.is_channel_ready,
    uniqueId: channel.user_channel_id || channel.channel_id,
    channelPoint,
    pubkey: channel.counterparty_node_id,
    capacity: String(capacity),
    localBalance: String(local),
    remoteBalance: String(remote),
    status: mapChannelStatus(channel),
    isPrivate: !channel.is_announced,
  };
};

export const mapChannelEvent = (
  event?: unknown,
): PLN.LightningNodeChannelEvent | null => {
  // ldk-server event streams are payment-only; channel updates are polled separately.
  void event;
  return null;
};
