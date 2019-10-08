import React from 'react';

import { Status } from 'types';
import { initChartFromNetwork } from 'utils/chart';
import { getNetwork, renderWithProviders } from 'utils/tests';
import Sidebar from './Sidebar';

describe('Sidebar Component', () => {
  const renderComponent = (selectedId?: string, status?: Status) => {
    const network = getNetwork(1, 'test network', status);
    const chart = initChartFromNetwork(network);

    if (selectedId) {
      chart.selected = { type: 'node', id: selectedId };
    }
    const result = renderWithProviders(<Sidebar network={network} chart={chart} />);
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
    const { findByText } = renderComponent('bitcoind-1');
    expect(await findByText('bitcoin')).toBeInTheDocument();
    expect(await findByText('bitcoind')).toBeInTheDocument();
  });

  it('should display lnd details', async () => {
    const { findByText } = renderComponent('lnd-1');
    expect(await findByText('lightning')).toBeInTheDocument();
    expect(await findByText('LND')).toBeInTheDocument();
  });

  it('should not display details of a selected invalid node', () => {
    const { getByText } = renderComponent('invalid-node');
    expect(getByText('Network Designer')).toBeInTheDocument();
  });
});
