import React from 'react';
import { Route } from 'react-router';
import { AppLayout } from 'components/layouts';
import { Home } from 'components/home';
import { NewNetwork, NetworkView } from 'components/network';
import { Switch, HOME, NETWORK } from 'components/routing';

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
