import { mapChannel, mapChannelEvent, mapChannelStatus } from './mappers';
import { LdkChannel } from './types';

describe('ldk-server mappers', () => {
  const baseChannel: LdkChannel = {
    channel_id: 'abc123',
    counterparty_node_id: '02' + 'a'.repeat(64),
    user_channel_id: 'user-channel-1',
    channel_value_sats: '1000000',
    outbound_capacity_msat: '500000000',
    inbound_capacity_msat: '400000000',
    is_outbound: true,
    is_channel_ready: true,
    is_usable: true,
    is_announced: false,
    funding_txo: {
      txid: 'deadbeef',
      vout: 0,
    },
  };

  it('maps open channels', () => {
    expect(mapChannelStatus(baseChannel)).toBe('Open');
    const mapped = mapChannel(baseChannel);
    expect(mapped.status).toBe('Open');
    expect(mapped.channelPoint).toBe('deadbeef:0');
    expect(mapped.isPrivate).toBe(true);
    expect(mapped.capacity).toBe('1000000');
    expect(mapped.localBalance).toBe('500000');
    expect(mapped.remoteBalance).toBe('400000');
  });

  it('maps opening channels', () => {
    const opening = { ...baseChannel, is_channel_ready: false, is_usable: false };
    expect(mapChannelStatus(opening)).toBe('Opening');
  });

  it('maps channel events', () => {
    expect(mapChannelEvent({ payment_successful: {} })).toBeNull();
    expect(mapChannelEvent({ payment_failed: {} })).toBeNull();
    expect(mapChannelEvent({ payment_claimable: {} })).toBeNull();
    expect(mapChannelEvent({})).toBeNull();
  });
});
