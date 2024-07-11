import React from 'react';
import { ILink } from '@mrblenny/react-flow-chart';
import { fireEvent, waitFor } from '@testing-library/react';
import { LightningNode, Status } from 'shared/types';
import { LightningNodeChannelAsset } from 'lib/lightning/types';
import { initChartFromNetwork } from 'utils/chart';
import {
  getNetwork,
  injections,
  lightningServiceMock,
  renderWithProviders,
  suppressConsoleErrors,
} from 'utils/tests';
import Channel from './Channel';

const bitcoindServiceMock = injections.bitcoindService as jest.Mocked<
  typeof injections.bitcoindService
>;

describe('Channel component', () => {
  const createChannelData = (status = Status.Stopped) => {
    const network = getNetwork(1, 'test network', status);

    const lnd = network.nodes.lightning[0];
    const cln = network.nodes.lightning[1];

    const initialState = {
      network: {
        networks: [network],
      },
      designer: {
        activeId: 1,
        allCharts: {
          [1]: initChartFromNetwork(network),
        },
      },
    };
    return { initialState, lnd, cln };
  };

  const renderComponent = (
    initialState: object,
    sourceNode: LightningNode,
    destNode: LightningNode,
    assets?: LightningNodeChannelAsset[],
  ) => {
    const link: ILink = {
      id: 'asdf',
      from: { nodeId: sourceNode.name, portId: 'asdf' },
      to: { nodeId: destNode.name, portId: 'asdf' },
      properties: {
        type: 'open-channel',
        capacity: '1000',
        fromBalance: '600',
        toBalance: '400',
        direction: 'ltr',
        status: 'Open',
        channelPoint: '884b29be9946380937cba43cefe431b75c1a9ad3c45184e55f444eda09e56150',
        isPrivate: false,
        assets,
      },
    };
    const result = renderWithProviders(
      <Channel link={link} from={sourceNode} to={destNode} />,
      {
        initialState,
      },
    );
    return { ...result };
  };

  const { initialState, lnd, cln } = createChannelData();

  describe('Channel Details', () => {
    it('should display Status', () => {
      const { getAllByText } = renderComponent(initialState, lnd, cln);
      expect(getAllByText('Status')).toHaveLength(3);
      expect(getAllByText('Stopped')).toHaveLength(2);
    });

    it('should display Capacity', () => {
      const { getByText } = renderComponent(initialState, lnd, cln);
      expect(getByText('Capacity')).toBeInTheDocument();
      expect(getByText('1,000 sats')).toBeInTheDocument();
    });

    it('should display Source Balance', () => {
      const { getByText } = renderComponent(initialState, lnd, cln);
      expect(getByText('Source Balance')).toBeInTheDocument();
      expect(getByText('600 sats')).toBeInTheDocument();
    });

    it('should display Destination Balance', () => {
      const { getByText } = renderComponent(initialState, lnd, cln);
      expect(getByText('Destination Balance')).toBeInTheDocument();
      expect(getByText('600 sats')).toBeInTheDocument();
    });

    it('should display "Channel Point" when source node is LND', () => {
      const { getByText } = renderComponent(initialState, lnd, cln);
      expect(getByText('Channel Point')).toBeInTheDocument();
      expect(getByText('884b...e56150')).toBeInTheDocument();
    });

    it('should display "Channel ID" when source node is CLN', () => {
      const { getByText } = renderComponent(initialState, cln, lnd);
      expect(getByText('Channel ID')).toBeInTheDocument();
      expect(getByText('884b...e56150')).toBeInTheDocument();
    });

    it('should display isPrivate', () => {
      const { getByText } = renderComponent(initialState, lnd, cln);
      expect(getByText('Is Private')).toBeInTheDocument();
      expect(getByText('false')).toBeInTheDocument();
    });
  });

  describe('LND Source Details', () => {
    it('should display Name', () => {
      const { getByText } = renderComponent(initialState, lnd, cln);
      expect(getByText(lnd.name)).toBeInTheDocument();
    });

    it('should display Implementation', () => {
      const { getAllByText } = renderComponent(initialState, lnd, cln);
      expect(getAllByText(lnd.implementation)).toHaveLength(1);
    });

    it('should display Version', () => {
      const { getAllByText } = renderComponent(initialState, lnd, cln);
      expect(getAllByText(`v${lnd.version}`)).toHaveLength(1);
    });

    it('should display Status', () => {
      const { getAllByText } = renderComponent(initialState, lnd, cln);
      expect(getAllByText(Status[lnd.status])).toHaveLength(2);
    });
  });

  describe('CLN Destination Details', () => {
    it('should display Name', () => {
      const { getByText } = renderComponent(initialState, lnd, cln);
      expect(getByText(cln.name)).toBeInTheDocument();
    });

    it('should display Implementation', () => {
      const { getAllByText } = renderComponent(initialState, lnd, cln);
      expect(getAllByText(cln.implementation)).toHaveLength(1);
    });

    it('should display Version', () => {
      const { getAllByText } = renderComponent(initialState, lnd, cln);
      expect(getAllByText(`v${cln.version}`)).toHaveLength(1);
    });

    it('should display Status', () => {
      const { getAllByText } = renderComponent(initialState, lnd, cln);
      expect(getAllByText(Status[cln.status])).toHaveLength(2);
    });
  });

  describe('Close Channel', () => {
    const { initialState, lnd, cln } = createChannelData(Status.Started);
    beforeEach(() => {
      lightningServiceMock.closeChannel.mockResolvedValue(true);
      lightningServiceMock.getChannels.mockResolvedValue([]);
      bitcoindServiceMock.mine.mockResolvedValue(['txid']);
    });

    it('should show the close channel modal', async () => {
      const { getByText, findByText } = renderComponent(initialState, lnd, cln);
      expect(getByText('Close Channel')).toBeInTheDocument();
      fireEvent.click(getByText('Close Channel'));
      expect(
        await findByText('Are you sure you want to close this channel?'),
      ).toBeInTheDocument();
      expect(getByText('Yes')).toBeInTheDocument();
      expect(getByText('Cancel')).toBeInTheDocument();
    });

    it('should close the channel successfully', async () => {
      const { getByText, findByText, getByLabelText } = renderComponent(
        initialState,
        lnd,
        cln,
      );
      expect(getByText('Close Channel')).toBeInTheDocument();
      fireEvent.click(getByText('Close Channel'));
      // antd creates two modals in the DOM for some silly reason. Need to click one
      fireEvent.click(await findByText('Yes'));
      // wait for the error notification to be displayed
      await waitFor(() => getByLabelText('check-circle'));
      expect(getByText('The channel has been closed')).toBeInTheDocument();
      expect(lightningServiceMock.closeChannel).toHaveBeenCalledTimes(1);
      expect(bitcoindServiceMock.mine).toHaveBeenCalledTimes(1);
    });

    it('should display an error if the node is not started', async () => {
      const { initialState, lnd, cln } = createChannelData(Status.Stopped);
      const { getByText, getByLabelText } = renderComponent(initialState, lnd, cln);
      expect(getByText('Close Channel')).toBeInTheDocument();
      fireEvent.click(getByText('Close Channel'));
      // wait for the error notification to be displayed
      await waitFor(() => getByLabelText('close-circle'));
      expect(getByText('Unable to close the channel')).toBeInTheDocument();
      expect(getByText('The source node must be Started')).toBeInTheDocument();
    });

    it('should display an error if closing the channel fails', async () => {
      // antd Modal.confirm logs a console error when onOk fails
      // this suppresses those errors from being displayed in test runs
      await suppressConsoleErrors(async () => {
        lightningServiceMock.closeChannel.mockRejectedValue(new Error('test error'));
        const { getByText, findByText, getByLabelText } = renderComponent(
          initialState,
          lnd,
          cln,
        );
        expect(getByText('Close Channel')).toBeInTheDocument();
        fireEvent.click(getByText('Close Channel'));
        // antd creates two modals in the DOM for some silly reason. Need to click one
        fireEvent.click(await findByText('Yes'));
        // wait for the error notification to be displayed
        await waitFor(() => getByLabelText('close-circle'));
        expect(getByText('Unable to close the channel')).toBeInTheDocument();
        expect(getByText('test error')).toBeInTheDocument();
      });
    });
  });

  describe('with assets', () => {
    it('should display list of assets', async () => {
      const asset: LightningNodeChannelAsset = {
        id: 'testId',
        name: 'test asset',
        capacity: '2345',
        localBalance: '1647',
        remoteBalance: '853',
      };
      const { initialState, lnd, cln } = createChannelData(Status.Stopped);
      const { getByText } = renderComponent(initialState, lnd, cln, [asset]);
      expect(getByText('test asset')).toBeInTheDocument();
      expect(getByText('(Taproot Asset)')).toBeInTheDocument();
      expect(getByText('testId')).toBeInTheDocument();
      expect(getByText('Asset ID')).toBeInTheDocument();
      expect(getByText('testId')).toBeInTheDocument();
      expect(getByText('2,345')).toBeInTheDocument();
      expect(getByText('1,647')).toBeInTheDocument();
      expect(getByText('853')).toBeInTheDocument();
    });
  });
});
