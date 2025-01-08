import React from 'react';
import { screen } from '@testing-library/react';
import { getNetwork, renderWithProviders } from 'utils/tests';
import BalanceChannelsModal from './BalanceChannelsModal';
import { ChannelInfo } from 'types';
import { initChartFromNetwork } from 'utils/chart';

jest.mock('utils/async');

describe('BalanceChannelsModal', () => {
  let unmount: () => void;

  const renderComponent = async (channelsInfo: ChannelInfo[] = []) => {
    const network = getNetwork(1, 'test network');

    const initialState = {
      designer: {
        activeId: network.id,
        allCharts: {
          [network.id]: initChartFromNetwork(network),
        },
      },
      lightning: {
        channelsInfo,
      },
      modals: {
        balanceChannels: {
          visible: true,
        },
      },
    };

    const cmp = <BalanceChannelsModal network={network} />;
    const result = renderWithProviders(cmp, { initialState });
    unmount = result.unmount;

    return {
      ...result,
      network,
    };
  };

  afterEach(() => unmount());

  it('should render modal title and buttons', async () => {
    const { getByText } = await renderComponent();
    expect(getByText('Balance Channels')).toBeInTheDocument();
    expect(getByText('Update Channels')).toBeInTheDocument();
    expect(getByText('Close')).toBeInTheDocument();
  });

  it('should render sliders for each channel', async () => {
    const channelsInfo = [
      {
        id: '1',
        from: 'NodeA',
        to: 'NodeB',
        remoteBalance: '4000',
        localBalance: '6000',
        nextLocalBalance: 6000,
      },
      {
        id: '2',
        from: 'NodeC',
        to: 'NodeD',
        remoteBalance: '5000',
        localBalance: '5000',
        nextLocalBalance: 5000,
      },
    ];

    const { getAllByRole } = await renderComponent(channelsInfo);

    expect(screen.getByText(/NodeA/)).toBeInTheDocument();
    expect(screen.getByText(/NodeB/)).toBeInTheDocument();
    expect(screen.getByText(/NodeC/)).toBeInTheDocument();
    expect(screen.getByText(/NodeD/)).toBeInTheDocument();
    expect(getAllByRole('slider')).toHaveLength(2);
  });
});
