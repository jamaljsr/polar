import React from 'react';
import { ILink } from '@mrblenny/react-flow-chart';
import { fireEvent, waitFor } from '@testing-library/react';
import { Status } from 'shared/types';
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
  const renderComponent = (status = Status.Stopped) => {
    const network = getNetwork(1, 'test network', status?.toString());
    const lnd1 = network.nodes.lightning[0];
    const lnd2 = network.nodes.lightning[3];
    const link: ILink = {
      id: 'asdf',
      from: { nodeId: lnd1.name, portId: 'asdf' },
      to: { nodeId: lnd2.name, portId: 'asdf' },
      properties: {
        type: 'open-channel',
        capacity: '1000',
        fromBalance: '600',
        toBalance: '400',
        direction: 'ltr',
        status: 'Open',
        isPrivate: false,
      },
    };
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
    const result = renderWithProviders(<Channel link={link} from={lnd1} to={lnd2} />, {
      initialState,
    });
    return { ...result, lnd1, lnd2, link };
  };

  describe('Channel Details', () => {
    it('should display Status', () => {
      const { getAllByText } = renderComponent();
      expect(getAllByText('Status')).toHaveLength(3);
      expect(getAllByText('Stopped')).toHaveLength(2);
    });

    it('should display Capacity', () => {
      const { getByText } = renderComponent();
      expect(getByText('Capacity')).toBeInTheDocument();
      expect(getByText('1,000 sats')).toBeInTheDocument();
    });

    it('should display Source Balance', () => {
      const { getByText } = renderComponent();
      expect(getByText('Source Balance')).toBeInTheDocument();
      expect(getByText('600 sats')).toBeInTheDocument();
    });

    it('should display Destination Balance', () => {
      const { getByText } = renderComponent();
      expect(getByText('Destination Balance')).toBeInTheDocument();
      expect(getByText('600 sats')).toBeInTheDocument();
    });
  });

  describe('LND Details', () => {
    it('should display Name', () => {
      const { getByText } = renderComponent();
      expect(getByText('alice')).toBeInTheDocument();
      expect(getByText('dave')).toBeInTheDocument();
    });

    it('should display Version', () => {
      const { getAllByText, lnd1 } = renderComponent();
      expect(getAllByText(`v${lnd1.version}`)).toHaveLength(2);
    });

    it('should display Status', () => {
      const { getAllByText, lnd1 } = renderComponent();
      expect(getAllByText(Status[lnd1.status])).toHaveLength(2);
    });
  });

  describe('Close Channel', () => {
    beforeEach(() => {
      lightningServiceMock.closeChannel.mockResolvedValue(true);
      lightningServiceMock.getChannels.mockResolvedValue([]);
      bitcoindServiceMock.mine.mockResolvedValue(['txid']);
    });

    it('should show the close channel modal', async () => {
      const { getByText, findByText } = renderComponent(Status.Started);
      expect(getByText('Close Channel')).toBeInTheDocument();
      fireEvent.click(getByText('Close Channel'));
      expect(
        await findByText('Are you sure you want to close this channel?'),
      ).toBeInTheDocument();
      expect(getByText('Yes')).toBeInTheDocument();
      expect(getByText('Cancel')).toBeInTheDocument();
    });

    it('should close the channel successfully', async () => {
      const { getByText, findByText, getByLabelText } = renderComponent(Status.Started);
      expect(getByText('Close Channel')).toBeInTheDocument();
      fireEvent.click(getByText('Close Channel'));
      // antd creates two modals in the DOM for some silly reason. Need to click one
      fireEvent.click(await findByText('Yes'));
      // wait for the error notification to be displayed
      await waitFor(() => getByLabelText('check-circle'));
      expect(getByText('The channel has been closed')).toBeInTheDocument();
      expect(lightningServiceMock.closeChannel).toBeCalledTimes(1);
      expect(bitcoindServiceMock.mine).toBeCalledTimes(1);
    });

    it('should display an error if the node is not started', async () => {
      const { getByText, getByLabelText } = renderComponent(Status.Stopped);
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
        const { getByText, findByText, getByLabelText } = renderComponent(Status.Started);
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
});
