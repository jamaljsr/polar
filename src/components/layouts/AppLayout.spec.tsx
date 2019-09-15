import React from 'react';
import { useTranslation } from 'react-i18next';
import { fireEvent } from '@testing-library/react';
import { renderWithProviders } from 'utils/tests';
import AppLayout from './AppLayout';

describe('AppLayout component', () => {
  const renderComponent = (route?: string) => {
    // create a wrapper component to test language switching
    const LangWrapper: React.FC = () => {
      const { t } = useTranslation();
      return (
        <AppLayout>
          <p>Hello World!</p>
          <p>{t('cmps.home.card-title')}</p>
        </AppLayout>
      );
    };
    return renderWithProviders(<LangWrapper />, { route });
  };

  it('should contain the text of child components', () => {
    const { getByText } = renderComponent();
    expect(getByText('Hello World!')).toBeInTheDocument();
  });

  it('should have language set to English by default', () => {
    const { getByText } = renderComponent();
    expect(getByText('Welcome to Polar')).toBeInTheDocument();
  });

  it('should set language to English', () => {
    const { getByText } = renderComponent();
    expect(getByText('Welcome to Polar')).toBeInTheDocument();
    fireEvent.click(getByText('ES'));
    expect(getByText('Bienvenido a Polar')).toBeInTheDocument();
    fireEvent.click(getByText('EN'));
    expect(getByText('Welcome to Polar')).toBeInTheDocument();
  });

  it('should set language to Spanish', async () => {
    const { getByText } = renderComponent();
    expect(getByText('Welcome to Polar')).toBeInTheDocument();
    fireEvent.click(getByText('ES'));
    expect(getByText('Bienvenido a Polar')).toBeInTheDocument();
  });

  it('should navigate to home page when logo clicked', () => {
    const { getByAltText, history } = renderComponent('/network');
    fireEvent.click(getByAltText('logo'));
    expect(history.location.pathname).toEqual('/');
  });
});
