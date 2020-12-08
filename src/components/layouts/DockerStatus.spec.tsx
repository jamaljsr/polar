import React from 'react';
import { renderWithProviders } from 'utils/tests';
import DockerStatus from './DockerStatus';

describe('DockerStatus component', () => {
  const renderComponent = (docker?: string, compose?: string) => {
    const initialState = {
      app: {
        dockerVersions: {
          docker: docker || '',
          compose: compose || '',
        },
      },
    };
    return renderWithProviders(<DockerStatus />, { initialState });
  };

  it('should display both versions', () => {
    const { getByText } = renderComponent('1.2.3', '4.5.6');
    expect(getByText('Docker v1.2.3')).toBeInTheDocument();
    expect(getByText('Compose v4.5.6')).toBeInTheDocument();
  });

  it('should display only docker version', () => {
    const { getByText, queryByText } = renderComponent('1.2.3');
    expect(getByText('Docker v1.2.3')).toBeInTheDocument();
    expect(queryByText('Compose')).toBeNull();
  });

  it('should display only compose version', () => {
    const { getByText, queryByText } = renderComponent('', '1.2.3');
    expect(getByText('Compose v1.2.3')).toBeInTheDocument();
    expect(queryByText('Docker')).toBeNull();
  });

  it('should not display either versions', () => {
    const { queryByText } = renderComponent();
    expect(queryByText(/Docker/)).toBeNull();
    expect(queryByText(/Compose/)).toBeNull();
  });
});
