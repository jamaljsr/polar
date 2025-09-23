import React from 'react';
import { Status } from 'shared/types';
import { getNetwork, renderWithProviders } from 'utils/tests';
import NetworkMonitoringButton from './NetworkMonitoringButton';
import { fireEvent } from '@testing-library/react';
import { initChartFromNetwork } from 'utils/chart';

describe('NetworkMonitoringButton', () => {
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
      modals: {
        networkMonitoring: { visible: false },
      },
    };
    const cmp = <NetworkMonitoringButton networkId={network.id} />;
    const result = renderWithProviders(cmp, { initialState });
    unmount = result.unmount;
    return result;
  };

  afterEach(() => unmount());

  it('should render the button', () => {
    const { getByRole } = renderComponent();
    const btn = getByRole('monitor-network');
    expect(btn).toBeInTheDocument();
  });

  it('should open the modal on click', () => {
    const { getByRole, store } = renderComponent();
    const btn = getByRole('monitor-network');
    fireEvent.click(btn);
    expect(store.getState().modals.networkMonitoring.visible).toBe(true);
  });
});
