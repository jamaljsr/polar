import React from 'react';
import { render } from '@testing-library/react';
import { StoreProvider } from 'easy-peasy';
import { ConnectedRouter } from 'connected-react-router';
import { Provider } from 'react-redux';
import { createMemoryHistory } from 'history';
import { createReduxStore } from 'store';

export const getNetwork = (): Network => ({
  id: 0,
  name: 'my-test',
  nodes: {
    bitcoin: [
      {
        id: 0,
        name: 'bitcoind1',
        type: 'bitcoin',
      },
    ],
    lightning: [
      {
        id: 0,
        name: 'alice',
        type: 'lightning',
        backendName: 'bitcoind1',
      },
      {
        id: 0,
        name: 'bob',
        type: 'lightning',
        backendName: 'bitcoind1',
      },
    ],
  },
});

/**
 * Renders a component inside of the redux provider for state and
 * routing contexts. Some imported components such as <Link /> will
 * not render without this
 * @param cmp the component under test to render
 * @param options configuration options for providers
 */
export const renderWithProviders = (
  component: React.ReactElement,
  options?: { route?: string },
) => {
  const history = createMemoryHistory();
  if (options && options.route) {
    history.push(options.route);
  }
  const injections = {
    networkManager: {
      create: jest.fn(),
    },
  };
  const store = createReduxStore({}, injections);
  const app = (
    <StoreProvider store={store}>
      <Provider store={store as any}>
        <ConnectedRouter history={history}>{component}</ConnectedRouter>
      </Provider>
    </StoreProvider>
  );
  return { ...render(app), history, injections };
};
