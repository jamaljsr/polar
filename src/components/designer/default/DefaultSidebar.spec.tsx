import React from 'react';
import { REACT_FLOW_CHART } from '@mrblenny/react-flow-chart';
import { createEvent, fireEvent } from '@testing-library/dom';
import { LndVersion, Status } from 'shared/types';
import { initChartFromNetwork } from 'utils/chart';
import {
  defaultStateBalances,
  defaultStateInfo,
  getNetwork,
  injections,
  lightningServiceMock,
  renderWithProviders,
} from 'utils/tests';
import DefaultSidebar from './DefaultSidebar';

const lndServiceMock = injections.lndService as jest.Mocked<typeof injections.lndService>;

describe('DefaultSidebar Component', () => {
  const renderComponent = (status?: Status) => {
    const network = getNetwork(1, 'test network', status);
    const chart = initChartFromNetwork(network);
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

    const result = renderWithProviders(<DefaultSidebar network={network} />, {
      initialState,
    });
    return {
      ...result,
      network,
    };
  };

  it('should render display a draggable LND node', () => {
    const { getByText } = renderComponent();
    expect(getByText(`LND v${LndVersion.latest}`)).toBeInTheDocument();
  });

  it('should allow dragging a node', async () => {
    const { getByText } = renderComponent();
    const lnd = getByText(`LND v${LndVersion.latest}`);
    const setData = jest.fn();
    const dragEvent = createEvent.dragStart(lnd);
    Object.defineProperty(dragEvent, 'dataTransfer', { value: { setData } });
    fireEvent(lnd, dragEvent);
    expect(setData).toBeCalledWith(
      REACT_FLOW_CHART,
      JSON.stringify({ type: 'lnd', version: LndVersion.latest }),
    );
  });

  describe('Sync Chart button', () => {
    it('should display an error if syncing the chart fails', async () => {
      lndServiceMock.getInfo.mockRejectedValue(new Error('failed to get info'));
      const { getByLabelText, findByText } = renderComponent(Status.Started);
      fireEvent.click(getByLabelText('icon: reload'));
      expect(await findByText('failed to get info')).toBeInTheDocument();
      expect(lndServiceMock.getInfo).toBeCalledTimes(2);
    });

    it('should sync the chart from LND nodes', async () => {
      lndServiceMock.getInfo.mockResolvedValue(defaultStateInfo({}));
      lndServiceMock.getBalances.mockResolvedValue(defaultStateBalances({}));
      lightningServiceMock.getChannels.mockResolvedValue([]);
      const { getByLabelText, findByText } = renderComponent(Status.Started);
      fireEvent.click(getByLabelText('icon: reload'));
      expect(
        await findByText('The designer has been synced with the Lightning nodes'),
      ).toBeInTheDocument();
      expect(lndServiceMock.getInfo).toBeCalledTimes(2);
      expect(lndServiceMock.getBalances).toBeCalledTimes(2);
      expect(lightningServiceMock.getChannels).toBeCalledTimes(2);
    });
  });
});
