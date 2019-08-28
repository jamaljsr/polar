import React from 'react';
import { Route } from 'react-router';
import { fireEvent } from '@testing-library/dom';
import { renderWithProviders, getNetwork, injections } from 'utils/tests';
import { Status } from 'types';
import NetworkView from './NetworkView';

describe('NetworkView Component', () => {
  const renderComponent = (route = '/network/1', status?: Status) => {
    const initialState = {
      network: {
        networks: [getNetwork(1, 'test network', status)],
      },
    };
    // NetworkView needs to be rendered by a route due to
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
    expect(getByText('test network')).toBeInTheDocument();
  });

  it('should render correct # of LND nodes', () => {
    const { queryAllByText } = renderComponent();
    expect(queryAllByText(/lnd-\d/)).toHaveLength(2);
  });

  it('should render correct # of bitcoind nodes', () => {
    const { queryAllByText } = renderComponent();
    expect(queryAllByText(/bitcoind-\d/)).toHaveLength(1);
  });

  it('should render an error if necessary', async () => {
    const errorMsg = 'failed to start';
    // mock dockerService.start to throw an error
    const mockDockerStart = injections.dockerService.start as jest.Mock;
    mockDockerStart.mockRejectedValueOnce(new Error(errorMsg));
    const { getByText, findByText } = renderComponent('/network/1');
    fireEvent.click(getByText('cmps.network-actions.primary-btn-start'));
    expect(await findByText(errorMsg)).toBeInTheDocument();
  });

  it('should change UI when network is started', async () => {
    const { getByText, findByText } = renderComponent();
    expect(getByText('cmps.status-tag.status-stopped')).toBeInTheDocument();
    fireEvent.click(getByText('cmps.network-actions.primary-btn-start'));
    // should switch to starting immediately
    expect(getByText('cmps.status-tag.status-starting')).toBeInTheDocument();
    // should change to started after some time (findBy* will wait)
    expect(await findByText('cmps.status-tag.status-started')).toBeInTheDocument();
  });

  it('should change UI when network is stopped', async () => {
    const { getByText, findByText } = renderComponent('/network/1', Status.Started);
    expect(getByText('cmps.status-tag.status-started')).toBeInTheDocument();
    fireEvent.click(getByText('cmps.network-actions.primary-btn-stop'));
    // should switch to stopping immediately
    expect(getByText('cmps.status-tag.status-stopping')).toBeInTheDocument();
    // should change to stopped after some time (findBy* will wait)
    expect(await findByText('cmps.status-tag.status-stopped')).toBeInTheDocument();
  });

  it('should do nothing when network is starting', async () => {
    const { getByText } = renderComponent('/network/1', Status.Starting);
    expect(getByText('cmps.status-tag.status-starting')).toBeInTheDocument();
    fireEvent.click(getByText('cmps.network-actions.primary-btn-starting'));
    // should switch to stopping immediately
    expect(getByText('cmps.status-tag.status-starting')).toBeInTheDocument();
  });
});
