import React from 'react';
import { renderWithProviders } from 'utils/tests';
import { HOME, NETWORK_IMPORT, NETWORK_NEW, Routes } from 'components/routing';

describe('App container', () => {
  const renderComponent = (route: string) => {
    const initialState = {
      app: {
        dockerVersions: {
          docker: '1.2.3',
          compose: '4.5.6',
        },
      },
    };
    return renderWithProviders(<Routes />, { route, initialState });
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
    expect(getByText('Import a Lightning Network')).toBeInTheDocument();
  });
});
