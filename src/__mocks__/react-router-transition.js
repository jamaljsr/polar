import React from 'react';

// mock the AnimatedSwitch with the normal Switch for testing
// because it raises an error, but works fine in the app
const MockSwitch = props => {
  // need to call mapStyles to get proper test coverage
  props.mapStyles({});
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { Switch } = require('react-router');
  return <Switch>{props.children}</Switch>;
};

module.exports = {
  AnimatedSwitch: MockSwitch,
  spring: jest.fn(() => ({})),
};
