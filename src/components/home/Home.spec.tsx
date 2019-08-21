import React from 'react';
import { fireEvent } from '@testing-library/react';
import { renderWithProviders } from 'utils/tests';
import Home from './Home';

describe('Home component', () => {
  const renderComponent = () => {
    return renderWithProviders(<Home />);
  };

  it('should contain a "Click Me!" button', () => {
    const { getByTestId } = renderComponent();
    expect(getByTestId('me-btn')).toHaveTextContent('cmps.home.me-btn');
  });

  it('should contain a link to Counter page', () => {
    const { getByTestId } = renderComponent();
    expect(getByTestId('counter-link')).toHaveTextContent('Counter');
  });

  it('should not show alert message', () => {
    const { queryByTestId } = renderComponent();
    expect(queryByTestId('success')).toBeFalsy();
  });

  it('should show alert after button is clicked', () => {
    const { getByTestId } = renderComponent();
    const btn = getByTestId('me-btn');
    fireEvent.click(btn);
    expect(getByTestId('success')).toHaveTextContent('cmps.home.success-text');
  });
});
