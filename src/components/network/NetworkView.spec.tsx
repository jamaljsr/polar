import React from 'react';
import { fireEvent } from '@testing-library/dom';
import { createMemoryHistory } from 'history';
import { Status } from 'types';
import { getNetwork, injections, renderWithProviders } from 'utils/tests';
import NetworkView from './NetworkView';

describe('NetworkView Component', () => {
  const renderComponent = (id: string | undefined, status?: Status) => {
    const initialState = {
      network: {
        networks: [getNetwork(1, 'test network', status)],
      },
    };
    const route = `/network/${id}`;
    const history = createMemoryHistory({ initialEntries: [route] });
    const location = { pathname: route, search: '', hash: '', state: undefined };
    const match = { params: { id }, isExact: true, path: '', url: route };
    const cmp = <NetworkView history={history} location={location} match={match} />;
    return renderWithProviders(cmp, { initialState, route });
  };

  it('should not render if the network is not found', () => {
    const { queryByText } = renderComponent('99');
    expect(queryByText('test network')).toBeNull();
  });

  it('should not render if the network id is not provided', () => {
    const { queryByText } = renderComponent(undefined);
    expect(queryByText('test network')).toBeNull();
  });

  it('should render the name', () => {
    const { getByText } = renderComponent('1');
    expect(getByText('test network')).toBeInTheDocument();
  });

  it('should render an error if necessary', async () => {
    const errorMsg = 'failed to start';
    // mock dockerService.start to throw an error
    const mockDockerStart = injections.dockerService.start as jest.Mock;
    mockDockerStart.mockRejectedValueOnce(new Error(errorMsg));
    const { getByText, findByText } = renderComponent('1');
    fireEvent.click(getByText('cmps.network-actions.primary-btn-start'));
    expect(await findByText(errorMsg)).toBeInTheDocument();
  });

  it('should change UI when network is started', async () => {
    const { getByText, findByText } = renderComponent('1');
    expect(getByText('cmps.status-tag.status-stopped')).toBeInTheDocument();
    fireEvent.click(getByText('cmps.network-actions.primary-btn-start'));
    // should switch to starting immediately
    expect(getByText('cmps.status-tag.status-starting')).toBeInTheDocument();
    // should change to started after some time (findBy* will wait)
    expect(await findByText('cmps.status-tag.status-started')).toBeInTheDocument();
  });

  it('should change UI when network is stopped', async () => {
    const { getByText, findByText } = renderComponent('1', Status.Started);
    expect(getByText('cmps.status-tag.status-started')).toBeInTheDocument();
    fireEvent.click(getByText('cmps.network-actions.primary-btn-stop'));
    // should switch to stopping immediately
    expect(getByText('cmps.status-tag.status-stopping')).toBeInTheDocument();
    // should change to stopped after some time (findBy* will wait)
    expect(await findByText('cmps.status-tag.status-stopped')).toBeInTheDocument();
  });

  it('should do nothing when network is starting', async () => {
    const { getByText } = renderComponent('1', Status.Starting);
    expect(getByText('cmps.status-tag.status-starting')).toBeInTheDocument();
    fireEvent.click(getByText('cmps.network-actions.primary-btn-starting'));
    // should switch to stopping immediately
    expect(getByText('cmps.status-tag.status-starting')).toBeInTheDocument();
  });
});
