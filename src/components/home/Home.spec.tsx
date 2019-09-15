import React from 'react';
import { fireEvent } from '@testing-library/react';
import { getNetwork, injections, renderWithProviders } from 'utils/tests';
import Home from './Home';

describe('Home component', () => {
  const renderComponent = () => {
    const initialState = {
      network: {
        networks: [
          getNetwork(1, 'my network 1'),
          getNetwork(2, 'my network 2'),
          getNetwork(3, 'my network 3'),
        ],
      },
    };
    return renderWithProviders(<Home />, { initialState });
  };

  it('should display a notification if it fails to load networks from disk', async () => {
    const loadMock = injections.dockerService.load as jest.Mock;
    loadMock.mockRejectedValue(new Error('error reading file'));
    const { findByText } = renderComponent();
    expect(await findByText('cmps.home.load-error-msg')).toBeInTheDocument();
  });

  it('should display a list of networks', () => {
    const { getByText } = renderComponent();
    expect(getByText('my network 1')).toBeInTheDocument();
    expect(getByText('my network 2')).toBeInTheDocument();
    expect(getByText('my network 3')).toBeInTheDocument();
  });

  it('should contain a "Click Me!" button', () => {
    const { getByTestId } = renderComponent();
    expect(getByTestId('me-btn')).toHaveTextContent('cmps.home.me-btn');
  });

  it('should contain a link to Counter page', () => {
    const { getByTestId } = renderComponent();
    expect(getByTestId('network-link')).toHaveTextContent('Network');
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
