import React from 'react';
import { Route } from 'react-router';
import { renderWithProviders, getNetwork } from 'utils/tests';
import NetworkView from './NetworkView';

describe('NetworkView Component', () => {
  const renderComponent = (route = '/network/1') => {
    const initialState = {
      network: {
        networks: [getNetwork(1, 'test network')],
      },
    };
    // NetworkView needs to be rendered by the router due to
    // RouteComponentProps not being easily mockable
    const cmp = <Route path="/network/:id" component={NetworkView} />;
    return renderWithProviders(cmp, { initialState, route });
  };

  it('should not render if the network is not found', () => {
    const { queryByText } = renderComponent('/network/99');
    expect(queryByText('test network')).toBeNull();
  });

  it('should render the name', () => {
    const { getByText } = renderComponent();
    expect(getByText('test network')).toBeTruthy();
  });

  it('should render correct # of LND nodes', () => {
    const { queryAllByText } = renderComponent();
    expect(queryAllByText(/lnd-\d/)).toHaveLength(2);
  });

  it('should render correct # of bitcoind nodes', () => {
    const { queryAllByText } = renderComponent();
    expect(queryAllByText(/bitcoind-\d/)).toHaveLength(1);
  });
});
