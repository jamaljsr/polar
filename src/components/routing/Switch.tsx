import React from 'react';
import { AnimatedSwitch, spring } from 'react-router-transition';
import styles from './Switch.module.less';

const mapStyles = (styles: any) => {
  return {
    opacity: styles.opacity,
    transform: `translateX(${styles.offset}px)`,
  };
};

const glide = (val: any) => {
  return spring(val, {
    stiffness: 174,
    damping: 19,
  });
};

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

const Switch: React.FC = ({ children }) => {
  return (
    <AnimatedSwitch {...pageTransitions} mapStyles={mapStyles} className={styles.switch}>
      {children}
    </AnimatedSwitch>
  );
};

export default Switch;
