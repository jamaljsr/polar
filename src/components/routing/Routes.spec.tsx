import React from 'react';
import { renderWithProviders } from 'utils/tests';
import { HOME, NETWORK, Routes } from 'components/routing';

describe('App container', () => {
  const renderComponent = (route: string) => {
    return renderWithProviders(<Routes />, { route });
  };

  it('should render the home page', () => {
    const { getByText } = renderComponent(HOME);
    expect(getByText('Click Me!')).toBeInTheDocument();
  });

  it('should render the new network page', () => {
    const { getByText } = renderComponent(NETWORK);
    expect(getByText('Create')).toBeInTheDocument();
  });
});
