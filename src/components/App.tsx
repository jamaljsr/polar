import React, { useEffect } from 'react';
import { Router } from 'react-router';
import { info } from 'electron-log';
import { StoreProvider } from 'easy-peasy';
import store, { hashHistory } from 'store';
import { Routes } from 'components/routing';
import DockerContainerShutdown from './common/DockerContainerShutdown';

const App: React.FC = () => {
  useEffect(() => info('Rendering App component'), []);
  return (
    // store provider for easy-peasy hooks
    <StoreProvider store={store}>
      <Router history={hashHistory}>
        <Routes />
      </Router>
      <DockerContainerShutdown />
    </StoreProvider>
  );
};

export default App;
