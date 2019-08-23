import React from 'react';
import { renderWithProviders } from 'utils/tests';
import Routes, { HOME, COUNTER, NETWORK } from './Routes';

describe('App container', () => {
  const renderComponent = (route: string) => {
    return renderWithProviders(<Routes />, { route });
  };

  it('should render the home page', () => {
    const { getByTestId } = renderComponent(HOME);
    expect(getByTestId('me-btn')).toHaveTextContent('home.me-btn');
  });

  it('should render the counter page', () => {
    const { getByTestId } = renderComponent(COUNTER);
    expect(getByTestId('counter')).toHaveTextContent('0');
  });

  it('should render the new network page', () => {
    const { getByTestId } = renderComponent(NETWORK);
    expect(getByTestId('submit')).toHaveTextContent('cmps.new-network.btn-create');
  });
});
