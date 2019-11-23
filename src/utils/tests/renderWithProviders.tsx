import React from 'react';
import { Provider } from 'react-redux';
import { render } from '@testing-library/react';
import { ConnectedRouter } from 'connected-react-router';
import { StoreProvider } from 'easy-peasy';
import { createMemoryHistory } from 'history';
import { LightningService } from 'lib/lightning/types';
import { createReduxStore } from 'store';
import { StoreInjections } from 'types';

export const lightningServiceMock: jest.Mocked<LightningService> = {
  getInfo: jest.fn(),
  getBalances: jest.fn(),
  getNewAddress: jest.fn(),
  getChannels: jest.fn(),
  openChannel: jest.fn(),
  closeChannel: jest.fn(),
  waitUntilOnline: jest.fn(),
};
// injections allow you to mock the dependencies of redux store actions
export const injections: StoreInjections = {
  ipc: jest.fn(),
  dockerService: {
    getVersions: jest.fn(),
    getImages: jest.fn(),
    saveComposeFile: jest.fn(),
    start: jest.fn(),
    stop: jest.fn(),
    removeNode: jest.fn(),
    saveNetworks: jest.fn(),
    loadNetworks: jest.fn(),
  },
  bitcoindService: {
    waitUntilOnline: jest.fn(),
    getBlockchainInfo: jest.fn(),
    getWalletInfo: jest.fn(),
    sendFunds: jest.fn(),
    mine: jest.fn(),
  },
  lndService: {
    onNodesDeleted: jest.fn(),
    waitUntilOnline: jest.fn(),
    getInfo: jest.fn(),
    getBalances: jest.fn(),
    getNewAddress: jest.fn(),
    getChannels: jest.fn(),
    openChannel: jest.fn(),
    closeChannel: jest.fn(),
  },
  lightningFactory: {
    getService: () => lightningServiceMock,
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
