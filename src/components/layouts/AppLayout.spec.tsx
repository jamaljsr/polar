import React from 'react';
import { fireEvent } from '@testing-library/react';
import { useTranslation } from 'react-i18next';
import { renderWithProviders } from 'utils/tests';
import AppLayout from './AppLayout';

describe('AppLayout component', () => {
  const renderComponent = (route?: string) => {
    return renderWithProviders(
      <AppLayout>
        <p data-tid="hello">Hello World!</p>
      </AppLayout>,
      { route },
    );
  };

  const changeLanguageMock = () => {
    // get access to the mocked 'changeLanguage' function
    const { i18n } = useTranslation();
    const changeLanguage = (i18n.changeLanguage as unknown) as jest.Mock<
      typeof i18n.changeLanguage
    >;
    return changeLanguage;
  };

  it('should contain a "Hello World!" text', () => {
    const { getByTestId } = renderComponent();
    expect(getByTestId('hello')).toHaveTextContent('Hello World!');
  });

  it('should set language to English', () => {
    const { getByTestId } = renderComponent();
    const changeLanguage = changeLanguageMock();
    fireEvent.click(getByTestId('english'));
    expect(changeLanguage.mock.calls.length).toBe(1);
    expect(changeLanguage.mock.calls[0][0]).toBe('en-US');
    changeLanguage.mockClear();
  });

  it('should set language to Spanish', async () => {
    const { getByTestId } = renderComponent();
    const changeLanguage = changeLanguageMock();
    fireEvent.click(getByTestId('spanish'));
    expect(changeLanguage.mock.calls.length).toBe(1);
    expect(changeLanguage.mock.calls[0][0]).toBe('es');
    changeLanguage.mockClear();
  });

  it('should navigate to home page when logo clicked', () => {
    const { getByTestId, history } = renderComponent('/counter');
    fireEvent.click(getByTestId('logo'));
    expect(history.location.pathname).toEqual('/');
  });
});
