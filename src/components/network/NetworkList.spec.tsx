import React from 'react';
import { fireEvent, wait } from '@testing-library/react';
import { Network } from 'types';
import { getNetwork, injections, renderWithProviders } from 'utils/tests';
import { NETWORK } from 'components/routing';
import NetworkList from './NetworkList';

describe('NetworkList Component', () => {
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
    return renderWithProviders(<NetworkList />, { initialState });
  };

  it('should display a title', async () => {
    const { getByTestId } = renderComponent();
    expect(getByTestId('header')).toHaveTextContent('cmps.network-list.title');
  });

  it('should display a notification if it fails to load networks from disk', async () => {
    const loadMock = injections.dockerService.load as jest.Mock;
    loadMock.mockRejectedValue(new Error('error reading file'));
    const { findByText } = renderComponent([]);
    expect(
      await findByText('Unable to load previously save networks'),
    ).toBeInTheDocument();
  });

  it('should display a big create button if no networks exist', () => {
    const { getByText } = renderComponent([]);
    expect(getByText('cmps.network-list.create-button')).toBeInTheDocument();
  });

  it('should not display a create button if one or more networks exist', () => {
    const { queryByText } = renderComponent();
    expect(queryByText('cmps.network-list.create-button')).toBeNull();
  });

  it('should go to the new network screen when the create button is clicked', () => {
    const { getByText, history } = renderComponent([]);
    fireEvent.click(getByText('cmps.network-list.create-button'));
    expect(history.location.pathname).toEqual(NETWORK);
  });

  it('should display a create icon if one or more networks exist', () => {
    const { getByTestId } = renderComponent();
    expect(getByTestId('create-icon')).toBeInTheDocument();
  });

  it('should not display a create icon if no networks exist', () => {
    const { queryByTestId } = renderComponent([]);
    expect(queryByTestId('create-icon')).toBeNull();
  });

  it('should go to the new network screen when the create icon is clicked', () => {
    const { getByTestId, history } = renderComponent();
    fireEvent.click(getByTestId('create-icon'));
    expect(history.location.pathname).toEqual(NETWORK);
  });

  it('should display a list of network names', async () => {
    const { getByText } = renderComponent();
    expect(getByText('my network 1')).toBeInTheDocument();
    expect(getByText('my network 2')).toBeInTheDocument();
    expect(getByText('my network 3')).toBeInTheDocument();
  });

  it('should show all networks collapsed by default', () => {
    const { queryByText } = renderComponent();
    expect(queryByText('cmps.network-list.start')).toBeNull();
    expect(queryByText('cmps.network-list.edit')).toBeNull();
    expect(queryByText('cmps.network-list.delete')).toBeNull();
  });

  it('should toggle open a selected network', () => {
    const { queryByText, getByText } = renderComponent();
    expect(queryByText('cmps.network-list.start')).toBeNull();
    fireEvent.click(getByText('my network 1'));
    expect(queryByText('cmps.network-list.start')).toBeInTheDocument();
  });

  it('should display start/edit/delete links for selected network', () => {
    const { queryByText, getByText } = renderComponent();
    fireEvent.click(getByText('my network 1'));
    expect(queryByText('cmps.network-list.start')).toBeInTheDocument();
    expect(queryByText('cmps.network-list.edit')).toBeInTheDocument();
    expect(queryByText('cmps.network-list.delete')).toBeInTheDocument();
  });

  it('should toggle a selected network closed when clicked again', () => {
    const { queryByText, getByText } = renderComponent();
    expect(queryByText('cmps.network-list.start')).toBeNull();
    fireEvent.click(getByText('my network 1'));
    expect(queryByText('cmps.network-list.start')).toBeVisible();
    fireEvent.click(getByText('my network 1'));
    wait(() => {
      // wait for the menu animation to complete
      expect(queryByText('cmps.network-list.start')).not.toBeVisible();
    });
  });
});
