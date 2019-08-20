import React from 'react';
import { Switch, Route } from 'react-router';
import { AppLayout } from './layouts';
import { Home } from './home';
import { Counter } from './counter';
import { NewNetwork } from './network';

export const HOME = '/';
export const COUNTER = '/counter';
export const NETWORK = '/network';

const Routes = () => (
  <AppLayout>
    <Switch>
      <Route path={HOME} exact component={Home} />
      <Route path={COUNTER} component={Counter} />
      <Route path={NETWORK} component={NewNetwork} />
    </Switch>
  </AppLayout>
);

export default Routes;
