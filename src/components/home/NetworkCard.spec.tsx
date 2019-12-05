import React from 'react';
import { fireEvent } from '@testing-library/dom';
import { getNetwork, renderWithProviders } from 'utils/tests';
import { NETWORK_VIEW } from 'components/routing';
import NetworkCard from './NetworkCard';

describe('NetworkCard component', () => {
  const network = getNetwork(1, 'my network 1');
  const renderComponent = () => {
    return renderWithProviders(<NetworkCard network={network} />);
  };

  it("should display the network's name", () => {
    const { getByText } = renderComponent();
    expect(getByText('my network 1')).toBeInTheDocument();
  });

  it('should display the number of lightning nodes', () => {
    const { getByText } = renderComponent();
    expect(getByText('3')).toBeInTheDocument();
  });

  it('should display the number of bitcoin nodes', () => {
    const { getByText } = renderComponent();
    expect(getByText('1')).toBeInTheDocument();
  });

  it('should navigate to the network view screen when clicked', () => {
    const { getByText, history } = renderComponent();
    fireEvent.click(getByText('my network 1'));
    expect(history.location.pathname).toEqual(NETWORK_VIEW(network.id));
  });
});
