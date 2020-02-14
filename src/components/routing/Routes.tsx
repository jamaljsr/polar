import React from 'react';
import { Route, Switch } from 'react-router';
import { Home } from 'components/home';
import { AppLayout } from 'components/layouts';
import { NetworkView, NewNetwork } from 'components/network';
import { NodeImagesView } from 'components/nodeImages';
import {
  HOME,
  NETWORK_NEW,
  NETWORK_VIEW,
  NODE_IMAGES,
  Switch as AnimatedSwitch,
  TERMINAL,
} from 'components/routing';
import { DockerTerminal } from 'components/terminal';

const Routes: React.FC = () => (
  <Switch>
    <Route path={TERMINAL(':type', ':name')} exact component={DockerTerminal} />
    <Route>
      <AppLayout>
        <AnimatedSwitch>
          <Route path={HOME} exact component={Home} />
          <Route path={NETWORK_NEW} exact component={NewNetwork} />
          <Route path={NETWORK_VIEW(':id')} component={NetworkView} />
          <Route path={NODE_IMAGES} component={NodeImagesView} />
        </AnimatedSwitch>
      </AppLayout>
    </Route>
  </Switch>
);

export default Routes;
