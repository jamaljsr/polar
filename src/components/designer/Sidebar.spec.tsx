import React from 'react';
import { ISelectedOrHovered } from '@mrblenny/react-flow-chart';
import { fireEvent } from '@testing-library/dom';
import { Status } from 'types';
import { initChartFromNetwork } from 'utils/chart';
import {
  getNetwork,
  injections,
  mockLndResponses,
  renderWithProviders,
} from 'utils/tests';
import Sidebar from './Sidebar';

const lndServiceMock = injections.lndService as jest.Mocked<typeof injections.lndService>;

describe('Sidebar Component', () => {
  const renderComponent = (
    selectedType?: ISelectedOrHovered['type'],
    selectedId?: string,
    status?: Status,
  ) => {
    const network = getNetwork(1, 'test network', status);
    const chart = initChartFromNetwork(network);
    if (selectedType && selectedId) {
      chart.selected = { type: selectedType, id: selectedId };
    }
    const initialState = {
      network: {
        networks: [network],
      },
      designer: {
        activeId: network.id,
        allCharts: {
          [network.id]: chart,
        },
      },
    };

    const result = renderWithProviders(<Sidebar network={network} chart={chart} />, {
      initialState,
    });
    return {
      ...result,
      network,
    };
  };

  it('should render default text when no node is selected', () => {
    const { getByText } = renderComponent();
    expect(getByText('Network Designer')).toBeInTheDocument();
  });

  it('should display bitcoind details', async () => {
    const { findByText } = renderComponent('node', 'bitcoind-1');
    expect(await findByText('bitcoin')).toBeInTheDocument();
    expect(await findByText('bitcoind')).toBeInTheDocument();
  });

  it('should display lnd details', async () => {
    const { findByText } = renderComponent('node', 'lnd-1');
    expect(await findByText('lightning')).toBeInTheDocument();
    expect(await findByText('LND')).toBeInTheDocument();
  });

  it('should not display details of a selected invalid node', () => {
    const { getByText } = renderComponent('node', 'invalid-node');
    expect(getByText('Network Designer')).toBeInTheDocument();
  });

  it('should display link details', async () => {
    const { findByText } = renderComponent('link', 'lnd-1-backend');
    expect(await findByText('Blockchain Backend Connection')).toBeInTheDocument();
  });

  describe('Sync Chart button', () => {
    it('should display an error if syncing the chart fails', async () => {
      lndServiceMock.getInfo.mockRejectedValue(new Error('failed to get info'));
      const { getByLabelText, findByText } = renderComponent(
        undefined,
        undefined,
        Status.Started,
      );
      fireEvent.click(getByLabelText('icon: reload'));
      expect(await findByText('failed to get info')).toBeInTheDocument();
      expect(lndServiceMock.getInfo).toBeCalledTimes(2);
    });

    it('should sync the chart from LND nodes', async () => {
      lndServiceMock.getInfo.mockResolvedValue(mockLndResponses.getInfo);
      lndServiceMock.getWalletBalance.mockResolvedValue(
        mockLndResponses.getWalletBalance,
      );
      lndServiceMock.listChannels.mockResolvedValue(mockLndResponses.listChannels);
      lndServiceMock.pendingChannels.mockResolvedValue(mockLndResponses.pendingChannels);
      const { getByLabelText, findByText } = renderComponent(
        undefined,
        undefined,
        Status.Started,
      );
      fireEvent.click(getByLabelText('icon: reload'));
      expect(
        await findByText('The designer has been synced with the Lightning nodes'),
      ).toBeInTheDocument();
      expect(lndServiceMock.getInfo).toBeCalledTimes(2);
      expect(lndServiceMock.getWalletBalance).toBeCalledTimes(2);
      expect(lndServiceMock.listChannels).toBeCalledTimes(2);
      expect(lndServiceMock.pendingChannels).toBeCalledTimes(2);
    });
  });
});
