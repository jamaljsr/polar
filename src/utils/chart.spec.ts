import { IChart } from '@mrblenny/react-flow-chart';
import { defaultChannel, defaultInfo } from 'shared';
import { LndNodeMapping } from 'store/models/lnd';
import { Network } from 'types';
import { initChartFromNetwork, updateChartFromLnd } from './chart';
import { getNetwork } from './tests';

describe('Chart Util', () => {
  let network: Network;
  let chart: IChart;
  let lndData: LndNodeMapping;

  beforeEach(() => {
    network = getNetwork();
    chart = initChartFromNetwork(network);
    lndData = {
      [network.nodes.lightning[0].name]: {
        info: defaultInfo({ identityPubkey: 'lnd1pubkey' }),
        channels: {
          open: [
            defaultChannel({
              remotePubkey: 'lnd2pubkey',
              channelPoint: 'xxxxxxxxxxxxxxxx:0',
              capacity: '1000',
              localBalance: '400',
              remoteBalance: '600',
              initiator: true,
            }),
          ],
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
    it('should create link for a channel', () => {
      const result = updateChartFromLnd(chart, lndData);
      expect(result.links['xxxxxxxxxx:0']).toBeTruthy();
    });
  });
});
