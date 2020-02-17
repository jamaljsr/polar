import React from 'react';
import { renderWithProviders } from 'utils/tests';
import { HOME, NETWORK_NEW, Routes, NETWORK_IMPORT } from 'components/routing';

describe('App container', () => {
  const renderComponent = (route: string) => {
    return renderWithProviders(<Routes />, { route });
  };

  it('should render the home page', async () => {
    const { findByText } = renderComponent(HOME);
    expect(await findByText("Let's get started!")).toBeInTheDocument();
  });

  it('should render the new network page', () => {
    const { getByText } = renderComponent(NETWORK_NEW);
    expect(getByText('Create Network')).toBeInTheDocument();
  });

  it('should render the import network page', () => {
    const { getByText } = renderComponent(NETWORK_IMPORT);
    expect(getByText('Import a pre-defined Lightning Network')).toBeInTheDocument();
  });
});
