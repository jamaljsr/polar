import React from 'react';
import { fireEvent } from '@testing-library/react';
import { renderWithProviders, getNetwork } from 'utils/tests';
import NetworkList from './NetworkList';

describe('NetworkList Component', () => {
  const renderComponent = () => {
    const initialState = {
      network: {
        networks: [
          getNetwork(0, 'my network 1'),
          getNetwork(1, 'my network 2'),
          getNetwork(2, 'my network 3'),
        ],
      },
    };
    return renderWithProviders(<NetworkList />, { initialState });
  };

  it('should display a title', () => {
    const { getByTestId } = renderComponent();
    expect(getByTestId('header')).toHaveTextContent('cmps.network-list.title');
  });

  it('should show a big add button if no networks exist', () => {});

  it('should display an Add Network icon if other networks exist', () => {});

  it('should go to the new network screen when the add button is clicked', () => {});

  it('should display a list of network names', async () => {
    const { getByText } = renderComponent();
    expect(getByText('my network 1')).toBeTruthy();
    expect(getByText('my network 2')).toBeTruthy();
    expect(getByText('my network 3')).toBeTruthy();
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
    expect(queryByText('cmps.network-list.start')).toBeTruthy();
  });

  it('should display start/edit/delete links for selected network', () => {
    const { queryByText, getByText } = renderComponent();
    fireEvent.click(getByText('my network 1'));
    expect(queryByText('cmps.network-list.start')).toBeTruthy();
    expect(queryByText('cmps.network-list.edit')).toBeTruthy();
    expect(queryByText('cmps.network-list.delete')).toBeTruthy();
  });
});
