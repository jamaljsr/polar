import React from 'react';
import { Route } from 'react-router';
import { Home } from 'components/home';
import { AppLayout } from 'components/layouts';
import { NetworkView, NewNetwork } from 'components/network';
import { HOME, NETWORK, Switch } from 'components/routing';

const Routes: React.FC = () => (
  <AppLayout>
    <Switch>
      <Route path={HOME} exact component={Home} />
      <Route path={NETWORK} exact component={NewNetwork} />
      <Route path="/network/:id" component={NetworkView} />
    </Switch>
  </AppLayout>
);

export default Routes;
