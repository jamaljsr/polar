import React from 'react';
import { useTranslation } from 'react-i18next';
import { fireEvent } from '@testing-library/react';
import { renderWithProviders } from 'utils/tests';
import AppLayout from './AppLayout';

describe('AppLayout component', () => {
  const renderComponent = (route?: string) => {
    const LangWrapper: React.FC = () => {
      const { t } = useTranslation();
      return (
        <AppLayout>
          <p>Hello World!</p>
          <p>{t('cmps.app-layout.new-network')}</p>
        </AppLayout>
      );
    };
    return renderWithProviders(<LangWrapper />, { route });
  };

  it('should contain a "Hello World!" text', () => {
    const { getByText } = renderComponent();
    expect(getByText('Hello World!')).toBeInTheDocument();
  });

  it('should have language set to English by default', () => {
    const { getByText } = renderComponent();
    expect(getByText('Network')).toBeInTheDocument();
  });

  it('should set language to English', () => {
    const { getByText } = renderComponent();
    expect(getByText('Network')).toBeInTheDocument();
    fireEvent.click(getByText('ES'));
    expect(getByText('Red')).toBeInTheDocument();
    fireEvent.click(getByText('EN'));
    expect(getByText('Network')).toBeInTheDocument();
  });

  it('should set language to Spanish', async () => {
    const { getByText } = renderComponent();
    expect(getByText('Network')).toBeInTheDocument();
    fireEvent.click(getByText('ES'));
    expect(getByText('Red')).toBeInTheDocument();
  });

  it('should navigate to home page when logo clicked', () => {
    const { getByAltText, history } = renderComponent('/network');
    fireEvent.click(getByAltText('logo'));
    expect(history.location.pathname).toEqual('/');
  });
});
