import React, { useEffect } from 'react';
import { hot } from 'react-hot-loader/root';
import { Provider } from 'react-redux';
import { ConnectedRouter } from 'connected-react-router';
import { StoreProvider } from 'easy-peasy';
import { info } from 'electron-log';
import { Routes } from 'components/routing';
import store, { hashHistory } from 'store';

const App: React.FC = () => {
  useEffect(() => info('Rendering App component'), []);
  return (
    // store provider for easy-peasy hooks
    <StoreProvider store={store}>
      {/* react-redux provider for router state */}
      <Provider store={store as any}>
        {/* connected-react-router  */}
        <ConnectedRouter history={hashHistory}>
          <Routes />
        </ConnectedRouter>
      </Provider>
    </StoreProvider>
  );
};

export default hot(App);
