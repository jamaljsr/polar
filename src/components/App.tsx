import React, { useEffect } from 'react';
import { hot } from 'react-hot-loader/root';
import { Provider } from 'react-redux';
import { info } from 'electron-log';
import { ConnectedRouter } from 'connected-react-router';
import { StoreProvider } from 'easy-peasy';
import store, { hashHistory } from 'store';
import { Routes } from 'components/routing';

const StoreProviderOverride = StoreProvider as any;
const ConnectedRouterOverride = ConnectedRouter as any;

const App: React.FC = () => {
  useEffect(() => info('Rendering App component'), []);
  return (
    // store provider for easy-peasy hooks
    <StoreProviderOverride store={store}>
      {/* react-redux provider for router state */}
      <Provider store={store as any}>
        {/* connected-react-router  */}
        <ConnectedRouterOverride history={hashHistory}>
          <Routes />
        </ConnectedRouterOverride>
      </Provider>
    </StoreProviderOverride>
  );
};

export default hot(App);
