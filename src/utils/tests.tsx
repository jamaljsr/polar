import React from 'react';
import { Provider } from 'react-redux';
import * as LND from '@radar/lnrpc';
import { render } from '@testing-library/react';
import { ConnectedRouter } from 'connected-react-router';
import { StoreProvider } from 'easy-peasy';
import { createMemoryHistory } from 'history';
import { Status } from 'shared/types';
import { createReduxStore } from 'store';
import { Network, StoreInjections } from 'types';
import { createNetwork } from './network';

export const getNetwork = (networkId = 1, name?: string, status?: Status): Network =>
  createNetwork({
    id: networkId,
    name: name || 'my-test',
    lndNodes: 2,
    bitcoindNodes: 1,
    status,
  });

// injections allow you to mock the dependencies of redux store actions
export const injections: StoreInjections = {
  dockerService: {
    saveComposeFile: jest.fn(),
    start: jest.fn(),
    stop: jest.fn(),
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
    clearCachedNodes: jest.fn(),
    waitUntilOnline: jest.fn(),
    getInfo: jest.fn(),
    getWalletBalance: jest.fn(),
    getNewAddress: jest.fn(),
    openChannel: jest.fn(),
    closeChannel: jest.fn(),
    listChannels: jest.fn(),
    pendingChannels: jest.fn(),
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

/**
 * Suppresses console errors when executing some code.
 * For example: antd Modal.confirm logs a console error when onOk fails
 * this supresses those errors from being displayed in test runs
 * @param func the code to run
 */
export const suppressConsoleErrors = async (func: () => any | Promise<any>) => {
  const oldConsoleErr = console.error;
  console.error = () => {};
  const result = func();
  if (typeof result.then === 'function') {
    await result;
  }
  console.error = oldConsoleErr;
};

export const mockLndResponses = {
  getInfo: {
    identityPubkey: '',
    alias: '',
    numPendingChannels: 0,
    numActiveChannels: 0,
    numPeers: 0,
    blockHeight: 0,
    blockHash: '',
    syncedToChain: false,
    testnet: false,
    chains: [],
    uris: [],
    bestHeaderTimestamp: '',
    version: '',
    numInactiveChannels: 0,
    color: '',
  } as LND.GetInfoResponse,
  getWalletBalance: {
    confirmedBalance: '0',
    unconfirmedBalance: '0',
    totalBalance: '0',
  } as LND.WalletBalanceResponse,
  listChannels: {
    channels: [],
  } as LND.ListChannelsResponse,
  pendingChannels: {
    totalLimboBalance: '0',
    pendingOpenChannels: [],
    pendingClosingChannels: [],
    pendingForceClosingChannels: [],
    waitingCloseChannels: [],
  } as LND.PendingChannelsResponse,
};
