import React from 'react';
import { Switch, Route } from 'react-router';
import { AppLayout } from './layouts';
import { Home } from './home';
import { NewNetwork, NetworkView } from './network';

export const HOME = '/';
export const NETWORK = '/network';
export const NETWORK_VIEW = (id: number) => `/network/${id}`;

const Routes = () => (
  <AppLayout>
    <Switch>
      <Route path={HOME} exact component={Home} />
      <Route path={NETWORK} exact component={NewNetwork} />
      <Route path="/network/:id" component={NetworkView} />
    </Switch>
  </AppLayout>
);

export default Routes;
