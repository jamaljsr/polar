import React from 'react';
import { AnimatedSwitch, spring } from 'react-router-transition';
import styled from '@emotion/styled';

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

const StyledSwitch = styled(AnimatedSwitch)`
  position: relative;
  flex: 1;
  display: flex;

  & > div {
    flex: 1;
    position: absolute;
    width: 100%;
    height: 100%;
    padding: 16px;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }
`;

const Switch: React.FC = ({ children }) => {
  return (
    <StyledSwitch {...pageTransitions} mapStyles={mapStyles}>
      {children}
    </StyledSwitch>
  );
};

export default Switch;
