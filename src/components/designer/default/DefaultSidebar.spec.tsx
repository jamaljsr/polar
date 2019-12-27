import React from 'react';
import { REACT_FLOW_CHART } from '@mrblenny/react-flow-chart';
import { createEvent, fireEvent } from '@testing-library/dom';
import os from 'os';
import { LndVersion, Status } from 'shared/types';
import { initChartFromNetwork } from 'utils/chart';
import { defaultRepoState } from 'utils/constants';
import {
  defaultStateBalances,
  defaultStateInfo,
  getNetwork,
  lightningServiceMock,
  renderWithProviders,
} from 'utils/tests';
import DefaultSidebar from './DefaultSidebar';

jest.mock('os', () => {
  const actualOS = jest.requireActual('os');
  return {
    ...actualOS,
    platform: jest.fn().mockReturnValue('darwin'),
  };
});

const mockOS = os as jest.Mocked<typeof os>;

describe('DefaultSidebar Component', () => {
  const renderComponent = (status?: Status) => {
    const network = getNetwork(1, 'test network', status);
    const chart = initChartFromNetwork(network);
    const initialState = {
      app: {
        dockerRepoState: defaultRepoState,
      },
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

  beforeEach(() => {
    mockOS.platform.mockReturnValue('darwin');
  });

  it('should display the version toggle', () => {
    const { getByText } = renderComponent();
    expect(getByText('Show All Versions')).toBeInTheDocument();
  });

  it('should display old versions when the toggle is clicked', () => {
    const { getByText, getAllByText, getByRole } = renderComponent();
    fireEvent.click(getByRole('switch'));
    expect(getByText(`LND v${LndVersion['0.8.0-beta']}`)).toBeInTheDocument();
    expect(getAllByText('latest')).toHaveLength(3);
  });

  it('should not display c-lightning nodes on Windows', () => {
    mockOS.platform.mockReturnValue('win32');
    const { queryByText, getAllByText, getByRole } = renderComponent();
    expect(queryByText('c-lightning')).not.toBeInTheDocument();
    fireEvent.click(getByRole('switch'));
    expect(getAllByText('latest')).toHaveLength(2);
  });

  it('should display a draggable LND node', () => {
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
      JSON.stringify({ type: 'LND', version: LndVersion.latest }),
    );
  });

  describe('Sync Chart button', () => {
    it('should display an error if syncing the chart fails', async () => {
      lightningServiceMock.getInfo.mockRejectedValue(new Error('failed to get info'));
      const { getByLabelText, findByText } = renderComponent(Status.Started);
      fireEvent.click(getByLabelText('icon: reload'));
      expect(await findByText('failed to get info')).toBeInTheDocument();
      expect(lightningServiceMock.getInfo).toBeCalledTimes(3);
    });

    it('should sync the chart from LND nodes', async () => {
      lightningServiceMock.getInfo.mockResolvedValue(defaultStateInfo({}));
      lightningServiceMock.getBalances.mockResolvedValue(defaultStateBalances({}));
      lightningServiceMock.getChannels.mockResolvedValue([]);
      const { getByLabelText, findByText } = renderComponent(Status.Started);
      fireEvent.click(getByLabelText('icon: reload'));
      expect(
        await findByText('The designer has been synced with the Lightning nodes'),
      ).toBeInTheDocument();
      expect(lightningServiceMock.getInfo).toBeCalledTimes(3);
      expect(lightningServiceMock.getBalances).toBeCalledTimes(3);
      expect(lightningServiceMock.getChannels).toBeCalledTimes(3);
    });
  });
});
