import React from 'react';
import { Network } from 'types';
import { getNetwork, injections, renderWithProviders } from 'utils/tests';
import Home from './Home';

describe('Home component', () => {
  const renderComponent = (initialNetworks?: Network[]) => {
    const initialState = {
      network: {
        networks: initialNetworks || [
          getNetwork(1, 'my network 1'),
          getNetwork(2, 'my network 2'),
          getNetwork(3, 'my network 3'),
        ],
      },
    };
    return renderWithProviders(<Home />, { initialState });
  };

  it('should display a notification if it fails to load networks from disk', async () => {
    const loadMock = injections.dockerService.loadNetworks as jest.Mock;
    loadMock.mockRejectedValue(new Error('error reading file'));
    const { findByText } = renderComponent();
    expect(await findByText('error reading file')).toBeInTheDocument();
  });

  it('should display the getting started card when no networks are created', async () => {
    const { findByText } = renderComponent([]);
    expect(await findByText("Let's get started!")).toBeInTheDocument();
    expect(await findByText('Create a Lightning Network')).toBeInTheDocument();
  });

  it('should display a list of networks', async () => {
    const { findByText } = renderComponent();
    expect(await findByText('my network 1')).toBeInTheDocument();
    expect(await findByText('my network 2')).toBeInTheDocument();
    expect(await findByText('my network 3')).toBeInTheDocument();
  });
});
