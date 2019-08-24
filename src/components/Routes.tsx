import React from 'react';
import { Switch, Route } from 'react-router';
import { AppLayout } from './layouts';
import { Home } from './home';
import { NewNetwork } from './network';

export const HOME = '/';
export const NETWORK = '/network';

const Routes = () => (
  <AppLayout>
    <Switch>
      <Route path={HOME} exact component={Home} />
      <Route path={NETWORK} component={NewNetwork} />
    </Switch>
  </AppLayout>
);

export default Routes;
