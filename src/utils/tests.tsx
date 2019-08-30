import React from 'react';
import { Provider } from 'react-redux';
import { join } from 'path';
import { render } from '@testing-library/react';
import { ConnectedRouter } from 'connected-react-router';
import { StoreProvider } from 'easy-peasy';
import { createMemoryHistory } from 'history';
import { createReduxStore } from 'store';
import { Network, Status, StoreInjections } from 'types';
import { dataPath } from './config';

export const getNetwork = (networkId = 1, name?: string, status?: Status): Network => ({
  id: networkId,
  name: name || 'my-test',
  status: status !== undefined ? status : Status.Stopped,
  path: join(dataPath, 'networks', networkId.toString()),
  nodes: {
    bitcoin: [
      {
        id: 1,
        name: 'bitcoind-1',
        type: 'bitcoin',
        implementation: 'bitcoind',
        status: status !== undefined ? status : Status.Stopped,
      },
    ],
    lightning: [
      {
        id: 1,
        name: 'lnd-1',
        type: 'lightning',
        implementation: 'LND',
        status: status !== undefined ? status : Status.Stopped,
        backendName: 'bitcoind1',
      },
      {
        id: 2,
        name: 'lnd-2',
        type: 'lightning',
        implementation: 'LND',
        status: status !== undefined ? status : Status.Stopped,
        backendName: 'bitcoind1',
      },
    ],
  },
});

// injections allow you to mock the dependencies of redux store actions
export const injections: StoreInjections = {
  dockerService: {
    create: jest.fn(),
    start: jest.fn(),
    stop: jest.fn(),
    save: jest.fn(),
  },
};

/**
 * Renders a component inside of the redux provider for state and
 * routing contexts. Some imported components such as <Link /> will
 * not render without this
 * @param cmp the component under test to render
 * @param options configuration options for providers
 */
export const renderWithProviders = (
  component: React.ReactElement,
  config?: { route?: string; initialState?: any },
) => {
  const options = config || {};
  // use in-memory history for testing
  const history = createMemoryHistory();
  if (options.route) {
    history.push(options.route);
  }
  // provide initial state if any
  const initialState = options.initialState || {};
  const store = createReduxStore({ initialState, injections, history });
  const result = render(
    <StoreProvider store={store}>
      <Provider store={store as any}>
        <ConnectedRouter history={history}>{component}</ConnectedRouter>
      </Provider>
    </StoreProvider>,
  );

  return { ...result, history, injections, store };
};
