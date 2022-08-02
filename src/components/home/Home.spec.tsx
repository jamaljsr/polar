import React from 'react';
import { fireEvent } from '@testing-library/react';
import { Network } from 'types';
import { getNetwork, injections, renderWithProviders } from 'utils/tests';
import Home from './Home';

describe('Home component', () => {
  const renderComponent = (initialNetworks?: Network[], initialized?: boolean) => {
    const initialState = {
      app: {
        initialized,
        dockerVersions: {
          docker: '1.2.3',
          compose: '4.5.6',
        },
      },
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

  it('should display node updates modal', async () => {
    const { findByText, getByText, store } = renderComponent([], true);
    expect(await findByText('Check for new Node Versions')).toBeInTheDocument();
    fireEvent.click(getByText('Check for new Node Versions'));
    expect(store.getState().modals.imageUpdates.visible).toBe(true);
  });

  it('should display a list of networks', async () => {
    const { findByText } = renderComponent();
    expect(await findByText('my network 1')).toBeInTheDocument();
    expect(await findByText('my network 2')).toBeInTheDocument();
    expect(await findByText('my network 3')).toBeInTheDocument();
  });
});
