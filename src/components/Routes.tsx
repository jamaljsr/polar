import React from 'react';
import { Route } from 'react-router';
import { AnimatedSwitch, spring } from 'react-router-transition';
import { AppLayout } from './layouts';
import { Home } from './home';
import { NewNetwork, NetworkView } from './network';
import styles from './Routes.module.less';

export const HOME = '/';
export const NETWORK = '/network';
export const NETWORK_VIEW = (id: number) => `/network/${id}`;

const mapStyles = (styles: any) => ({
  opacity: styles.opacity,
  transform: `translateX(${styles.offset}px)`,
});

const glide = (val: any) =>
  spring(val, {
    stiffness: 174,
    damping: 19,
  });

const pageTransitions = {
  atEnter: {
    offset: 200,
    opacity: 0,
  },
  atLeave: {
    offset: glide(-100),
    opacity: glide(0),
  },
  atActive: {
    offset: glide(0),
    opacity: glide(1),
  },
};

const Routes = () => (
  <AppLayout>
    <AnimatedSwitch {...pageTransitions} mapStyles={mapStyles} className={styles.switch}>
      <Route path={HOME} exact component={Home} />
      <Route path={NETWORK} exact component={NewNetwork} />
      <Route path="/network/:id" component={NetworkView} />
    </AnimatedSwitch>
  </AppLayout>
);

export default Routes;
