import { IChart } from '@mrblenny/react-flow-chart';
import {
  defaultChannel,
  defaultInfo,
  defaultPendingChannel,
  defaultPendingOpenChannel,
} from 'shared';
import { LndNodeMapping } from 'store/models/lnd';
import { Network } from 'types';
import { initChartFromNetwork, updateChartFromLnd } from './chart';
import { getNetwork } from './tests';

describe('Chart Util', () => {
  let network: Network;
  let chart: IChart;
  let lndData: LndNodeMapping;

  const addChannel = (node: string, remotePubkey: string, pending?: boolean) => {
    const { channels } = lndData[node];
    if (channels) {
      if (!pending) {
        channels.open.push(
          defaultChannel({
            remotePubkey,
            channelPoint: 'xxxxxxxxxxxxxxxx:0',
            capacity: '1000',
            localBalance: '400',
            remoteBalance: '600',
            initiator: true,
          }),
        );
      } else {
        channels.opening.push(
          defaultPendingOpenChannel({
            channel: defaultPendingChannel({
              remoteNodePub: remotePubkey,
              channelPoint: 'xxxxxxxxxxxxxxxx:0',
              capacity: '1000',
              localBalance: '400',
              remoteBalance: '600',
            }),
          }),
        );
      }
    }
  };

  beforeEach(() => {
    network = getNetwork();
    chart = initChartFromNetwork(network);
    lndData = {
      [network.nodes.lightning[0].name]: {
        info: defaultInfo({ identityPubkey: 'lnd1pubkey' }),
        channels: {
          open: [],
          opening: [],
          closing: [],
          forceClosing: [],
          waitingClose: [],
        },
      },
      [network.nodes.lightning[1].name]: {
        info: defaultInfo({ identityPubkey: 'lnd2pubkey' }),
        channels: {
          open: [],
          opening: [],
          closing: [],
          forceClosing: [],
          waitingClose: [],
        },
      },
    };
  });

  describe('updateChartFromNetwork', () => {
    it('should create link for an open channel', () => {
      addChannel('lnd-1', 'lnd2pubkey');
      const result = updateChartFromLnd(chart, lndData);
      expect(result.links['xxxxxxxxxx:0']).toBeDefined();
      const link = result.links['xxxxxxxxxx:0'];
      expect(link.from.nodeId).toBe('lnd-1');
      expect(link.to.nodeId).toBe('lnd-2');
      expect(link.properties.type).toBe('open-channel');
      expect(link.properties.status).toBe('Open');
      expect(link.properties.capacity).toBe('1000');
    });

    it('should create link for a pending channel', () => {
      addChannel('lnd-1', 'lnd2pubkey', true);
      const result = updateChartFromLnd(chart, lndData);
      expect(result.links['xxxxxxxxxx:0']).toBeDefined();
      const link = result.links['xxxxxxxxxx:0'];
      expect(link.from.nodeId).toBe('lnd-1');
      expect(link.to.nodeId).toBe('lnd-2');
      expect(link.properties.type).toBe('pending-channel');
      expect(link.properties.status).toBe('Opening');
      expect(link.properties.capacity).toBe('1000');
    });

    it('should remove links for channels that do not exist', () => {
      addChannel('lnd-1', 'lnd2pubkey');
      const result = updateChartFromLnd(chart, lndData);
      expect(result.links['xxxxxxxxxx:0']).toBeTruthy();
      // remove the channel
      const { channels } = lndData['lnd-1'];
      if (channels) channels.open = [];
      const result2 = updateChartFromLnd(result, lndData);
      expect(result2.links['xxxxxxxxxx:0']).toBeUndefined();
    });

    it('should make no changes if channels is undefined', () => {
      lndData['lnd-1'].channels = undefined;
      lndData['lnd-2'].channels = undefined;
      const result = updateChartFromLnd(chart, lndData);
      expect(result).toEqual(chart);
    });

    it('should point link right to left', () => {
      chart.nodes['lnd-1'].position.x = 200;
      chart.nodes['lnd-2'].position.x = 100;
      addChannel('lnd-1', 'lnd2pubkey');
      const result = updateChartFromLnd(chart, lndData);
      const link = result.links['xxxxxxxxxx:0'];
      expect(link.properties.direction).toEqual('rtl');
    });

    it('should update the node sizes', () => {
      chart.nodes['lnd-1'].size = { width: 100, height: 20 };
      chart.nodes['lnd-2'].size = { width: 100, height: 20 };
      addChannel('lnd-1', 'lnd2pubkey');
      const result = updateChartFromLnd(chart, lndData);
      let size = result.nodes['lnd-1'].size;
      expect(size).toBeDefined();
      if (size) expect(size.height).toBe(60);
      size = result.nodes['lnd-2'].size;
      expect(size).toBeDefined();
      if (size) expect(size.height).toBe(60);
    });
  });
});
