import React from 'react';
import { Switch, Route } from 'react-router';
import { AppLayout } from './layouts';
import { Home } from './home';
import { Counter } from './counter';

export const HOME = '/';
export const COUNTER = '/counter';

const Routes = () => (
  <AppLayout>
    <Switch>
      <Route path={COUNTER} component={Counter} />
      <Route path={HOME} component={Home} />
    </Switch>
  </AppLayout>
);

export default Routes;
