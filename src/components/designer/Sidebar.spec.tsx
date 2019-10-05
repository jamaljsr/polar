import React from 'react';
import { wait } from '@testing-library/dom';
import { initChartFromNetwork } from 'utils/chart';
import { getNetwork, renderWithProviders } from 'utils/tests';
import Sidebar from './Sidebar';

describe('Sidebar Component', () => {
  const openChannel = jest.fn();
  const renderComponent = (selectedId?: string) => {
    const network = getNetwork();
    const chart = initChartFromNetwork(network);

    if (selectedId) {
      chart.selected = { type: 'node', id: selectedId };
    }
    const result = renderWithProviders(
      <Sidebar network={network} chart={chart} onOpenChannel={openChannel} />,
    );
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

  it('should display the wallet balance of a selected bitcoin node', async () => {
    const { findByText, store } = renderComponent('bitcoind-1');
    await wait(() => {
      store.getActions().bitcoind.setWalletinfo({ balance: 0.001 } as any);
    });
    expect(await findByText('100,000 sats')).toBeInTheDocument();
  });

  it('should display the wallet balance of a selected LND node', async () => {
    const { findByText, store, network } = renderComponent('lnd-1');
    await wait(() => {
      store.getActions().lnd.setWalletBalance({
        node: network.nodes.lightning[0],
        balance: { confirmedBalance: '100000' } as any,
      });
    });
    expect(await findByText('100,000 sats')).toBeInTheDocument();
  });
});
