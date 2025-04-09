import React from 'react';
import { Status } from 'shared/types';
import { getNetwork, renderWithProviders } from 'utils/tests';
import BalanceChannelsButton from './BalanceChannelsButton';
import { fireEvent } from '@testing-library/react';
import { initChartFromNetwork } from 'utils/chart';

describe('BalanceChannelsButton', () => {
  let unmount: () => void;

  const renderComponent = () => {
    const network = getNetwork(1, 'test network', Status.Started);

    const initialState = {
      network: {
        networks: [network],
      },
      designer: {
        activeId: 1,
        allCharts: {
          1: initChartFromNetwork(network),
        },
      },
    };

    const cmp = <BalanceChannelsButton network={network} />;
    const result = renderWithProviders(cmp, { initialState });
    unmount = result.unmount;
    return result;
  };

  afterEach(() => unmount());

  it('should render the button', async () => {
    const mockChannelInfo = {
      uniqueId: 'channel1',
      id: 'channel1',
      to: 'node2',
      from: 'node1',
      localBalance: '1000',
      remoteBalance: '2000',
      nextLocalBalance: 1000,
      pending: false,
      channelPoint: '',
      pubkey: '',
      capacity: '',
      status: 'Open' as const,
      isPrivate: false,
    };
    const { getByRole, store } = renderComponent();
    store.getActions().lightning.setChannelsInfo([mockChannelInfo]);
    const btn = getByRole('balance-channels');
    expect(btn).toBeInTheDocument();

    fireEvent.click(btn);
    expect(store.getState().modals.balanceChannels.visible).toBe(true);
  });
});
