import { defaultLndChannel, defaultLndPendingChannel } from 'shared';
import { mapOpenChannel, mapPendingChannel } from './mappers';

jest.mock('electron-log');

// encoded channel assets data for tapd <v0.5.x
const customChannelDataV5 = Buffer.from(
  '7b22617373657473223a5b7b2261737365745f7574786f223a7b2276657273696f6e223a312c2261737365745f67656e65736973223a7b2267656e657369735f706f696e74223a22363034343536646133663938326662613336373065383233353238393536386566363830356366316366303064666662643732623863333539326132363338373a31222c226e616d65223a22414141222c226d6574615f68617368223a2230303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030222c2261737365745f6964223a2238623436663166663763383363613432623862306131396139396130666363636633636662376631613833646561333061356664643535323030323235376461227d2c22616d6f756e74223a3530302c227363726970745f6b6579223a22303235306161656231363666343233343635306438346132643861313330393837616561663639353032303665303930353430316565373466663366386431386536227d2c226361706163697479223a3530302c226c6f63616c5f62616c616e6365223a3330302c2272656d6f74655f62616c616e6365223a3230307d5d7d',
  'hex',
);
// encoded channel assets data for tapd >=v0.6.x
const customChannelDataV6 = Buffer.from(
  '7b2266756e64696e675f617373657473223a5b7b2276657273696f6e223a312c2261737365745f67656e65736973223a7b2267656e657369735f706f696e74223a22363964643166653031653836636431303364633939306632393436376638346334616165353830313465343465386237356435633161313762616239666664323a31222c226e616d65223a2254455354222c226d6574615f68617368223a2237376363383439353633656631343061633136366638666431643230623462613236376431643762633139653963363664616362326566616365366334646461222c2261737365745f6964223a2234343162623537346632623764383935393633343162333339336434663861633732313461373564323563353031656437376562306532653562303934353039227d2c22616d6f756e74223a3130303030302c227363726970745f6b6579223a22303235306161656231363666343233343635306438346132643861313330393837616561663639353032303665303930353430316565373466663366386431386536222c22646563696d616c5f646973706c6179223a327d5d2c226c6f63616c5f617373657473223a5b7b2261737365745f6964223a2234343162623537346632623764383935393633343162333339336434663861633732313461373564323563353031656437376562306532653562303934353039222c22616d6f756e74223a36303030307d5d2c2272656d6f74655f617373657473223a5b7b2261737365745f6964223a2234343162623537346632623764383935393633343162333339336434663861633732313461373564323563353031656437376562306532653562303934353039222c22616d6f756e74223a34303030307d5d2c226f7574676f696e675f68746c6373223a5b5d2c22696e636f6d696e675f68746c6373223a5b5d2c226361706163697479223a3130303030302c226c6f63616c5f62616c616e6365223a36303030302c2272656d6f74655f62616c616e6365223a34303030302c226f7574676f696e675f68746c635f62616c616e6365223a302c22696e636f6d696e675f68746c635f62616c616e6365223a307d',
  'hex',
);
const emptyCustomChannelData = Buffer.from(JSON.stringify({}), 'utf-8');

describe('LndMappers', () => {
  const txid = 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2';
  const pubkey = '02a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2';

  describe('mapOpenChannel', () => {
    it('should map properties correctly', () => {
      const lndChannel = defaultLndChannel({
        channelPoint: `${txid}:0`,
        remotePubkey: pubkey,
        capacity: '1000',
        localBalance: '500',
        remoteBalance: '500',
        private: true,
      });

      const result = mapOpenChannel(lndChannel);

      expect(result).toEqual(
        expect.objectContaining({
          pending: false,
          uniqueId: `${txid}-0`,
          channelPoint: `${txid}:0`,
          pubkey,
          capacity: '1000',
          localBalance: '500',
          remoteBalance: '500',
          status: 'Open',
          isPrivate: true,
        }),
      );
    });

    it('should produce unique IDs for batch-opened channels with same txid', () => {
      const chan0 = defaultLndChannel({ channelPoint: `${txid}:0` });
      const chan1 = defaultLndChannel({ channelPoint: `${txid}:1` });

      expect(mapOpenChannel(chan0).uniqueId).not.toBe(mapOpenChannel(chan1).uniqueId);
    });

    it('should parse custom channel data', () => {
      const lndChannel = defaultLndChannel({
        channelPoint: `${txid}:0`,
        customChannelData: customChannelDataV6,
      });

      const result = mapOpenChannel(lndChannel);

      expect(result.assets).toHaveLength(1);
      expect(result.assets![0]).toEqual({
        id: '441bb574f2b7d89596341b3393d4f8ac7214a75d25c501ed77eb0e2e5b094509',
        name: 'TEST',
        capacity: '100000',
        localBalance: '60000',
        remoteBalance: '40000',
        decimals: 2,
        groupKey: undefined,
      });
    });

    it('should parse v0.5.x custom channel data', () => {
      const lndChannel = defaultLndChannel({
        channelPoint: `${txid}:0`,
        customChannelData: customChannelDataV5,
      });

      const result = mapOpenChannel(lndChannel);

      expect(result.assets).toHaveLength(1);
      expect(result.assets).toEqual([
        {
          id: '8b46f1ff7c83ca42b8b0a19a99a0fcccf3cfb7f1a83dea30a5fdd552002257da',
          name: 'AAA',
          capacity: '500',
          localBalance: '300',
          remoteBalance: '200',
          decimals: undefined,
          groupKey: undefined,
        },
      ]);
    });

    it('should prioritize v0.5.x format if both formats are present', () => {
      const mixedChannelData = Buffer.from(
        JSON.stringify({
          // v0.5.x format
          assets: [
            {
              version: 0,
              asset_utxo: {
                asset_genesis: {
                  genesis_point: 'genesis3:1',
                  name: 'ASSET3',
                  meta_hash: 'hash3',
                  asset_id: 'id3',
                },
                amount: 3000,
                script_key: 'key3',
                decimal_display: 4,
              },
              capacity: 3000,
              local_balance: 1500,
              remote_balance: 1500,
            },
          ],
          // New format
          funding_assets: [
            {
              version: 1,
              asset_genesis: {
                genesis_point: 'genesis1:1',
                name: 'ASSET1',
                meta_hash: 'hash1',
                asset_id: 'id1',
              },
              amount: 1000,
              script_key: 'key1',
              decimal_display: 2,
            },
          ],
          local_assets: [{ asset_id: 'id1', amount: 600 }],
          remote_assets: [{ asset_id: 'id1', amount: 400 }],
        }),
      );

      const lndChannel = defaultLndChannel({
        channelPoint: `${txid}:0`,
        customChannelData: mixedChannelData,
      });

      const result = mapOpenChannel(lndChannel);

      // Should return v0.5.x asset (ASSET3) not new asset (ASSET1)
      expect(result.assets).toHaveLength(1);
      expect(result.assets![0].name).toBe('ASSET3');
    });

    it('should return empty assets list when custom channel data is invalid JSON', () => {
      const lndChannel = defaultLndChannel({
        channelPoint: `${txid}:0`,
        customChannelData: Buffer.from('invalid-json'),
      });

      const result = mapOpenChannel(lndChannel);

      expect(result.assets).toHaveLength(0);
    });

    it('should return empty assets list when custom channel data has no assets', () => {
      const lndChannel = defaultLndChannel({
        channelPoint: `${txid}:0`,
        customChannelData: emptyCustomChannelData,
      });

      const result = mapOpenChannel(lndChannel);

      expect(result.assets).toHaveLength(0);
    });
  });

  describe('mapPendingChannel', () => {
    it('should map properties correctly', () => {
      const lndChannel = defaultLndPendingChannel({
        channelPoint: `${txid}:0`,
        remoteNodePub: pubkey,
        capacity: '1000',
        localBalance: '500',
        remoteBalance: '500',
      });

      const result = mapPendingChannel('Opening')(lndChannel);

      expect(result).toEqual(
        expect.objectContaining({
          pending: true,
          uniqueId: `${txid}-0`,
          channelPoint: `${txid}:0`,
          pubkey,
          capacity: '1000',
          localBalance: '500',
          remoteBalance: '500',
          status: 'Opening',
          isPrivate: false,
        }),
      );
    });

    it('should produce unique IDs for batch-opened channels with same txid', () => {
      const chan0 = defaultLndPendingChannel({ channelPoint: `${txid}:0` });
      const chan1 = defaultLndPendingChannel({ channelPoint: `${txid}:1` });

      const res0 = mapPendingChannel('Opening')(chan0);
      const res1 = mapPendingChannel('Opening')(chan1);

      expect(res0.uniqueId).not.toBe(res1.uniqueId);
    });

    it('should parse custom channel data for pending channels', () => {
      const lndChannel = defaultLndPendingChannel({
        channelPoint: `${txid}:0`,
        customChannelData: customChannelDataV6,
      });

      const result = mapPendingChannel('Opening')(lndChannel);

      expect(result.assets).toHaveLength(1);
      expect(result.assets![0]).toEqual({
        id: '441bb574f2b7d89596341b3393d4f8ac7214a75d25c501ed77eb0e2e5b094509',
        name: 'TEST',
        capacity: '100000',
        localBalance: '60000',
        remoteBalance: '40000',
        decimals: 2,
        groupKey: undefined,
      });
    });

    it('should parse v0.5.x custom channel data for pending channels', () => {
      const lndChannel = defaultLndPendingChannel({
        channelPoint: `${txid}:0`,
        customChannelData: customChannelDataV5,
      });

      const result = mapPendingChannel('Opening')(lndChannel);

      expect(result.assets).toHaveLength(1);
      expect(result.assets).toEqual([
        {
          id: '8b46f1ff7c83ca42b8b0a19a99a0fcccf3cfb7f1a83dea30a5fdd552002257da',
          name: 'AAA',
          capacity: '500',
          localBalance: '300',
          remoteBalance: '200',
          decimals: undefined,
          groupKey: undefined,
        },
      ]);
    });

    it('should prioritize v0.5.x format if both formats are present for pending channels', () => {
      const mixedChannelData = Buffer.from(
        JSON.stringify({
          // v0.5.x format
          assets: [
            {
              version: 0,
              asset_utxo: {
                asset_genesis: {
                  genesis_point: 'genesis3:1',
                  name: 'ASSET3',
                  meta_hash: 'hash3',
                  asset_id: 'id3',
                },
                amount: 3000,
                script_key: 'key3',
                decimal_display: 4,
              },
              capacity: 3000,
              local_balance: 1500,
              remote_balance: 1500,
            },
          ],
          // New format
          funding_assets: [
            {
              version: 1,
              asset_genesis: {
                genesis_point: 'genesis1:1',
                name: 'ASSET1',
                meta_hash: 'hash1',
                asset_id: 'id1',
              },
              amount: 1000,
              script_key: 'key1',
              decimal_display: 2,
            },
          ],
          local_assets: [{ asset_id: 'id1', amount: 600 }],
          remote_assets: [{ asset_id: 'id1', amount: 400 }],
        }),
      );

      const lndChannel = defaultLndPendingChannel({
        channelPoint: `${txid}:0`,
        customChannelData: mixedChannelData,
      });

      const result = mapPendingChannel('Opening')(lndChannel);

      // Should return v0.5.x asset (ASSET3) not new asset (ASSET1)
      expect(result.assets).toHaveLength(1);
      expect(result.assets![0].name).toBe('ASSET3');
    });

    it('should return empty assets list when custom channel data is invalid JSON for pending channels', () => {
      const lndChannel = defaultLndPendingChannel({
        channelPoint: `${txid}:0`,
        customChannelData: Buffer.from('invalid-json'),
      });

      const result = mapPendingChannel('Opening')(lndChannel);

      expect(result.assets).toHaveLength(0);
    });

    it('should return empty assets list when custom channel data has no assets for pending channels', () => {
      const lndChannel = defaultLndPendingChannel({
        channelPoint: `${txid}:0`,
        customChannelData: emptyCustomChannelData,
      });

      const result = mapPendingChannel('Opening')(lndChannel);

      expect(result.assets).toHaveLength(0);
    });
  });
});
