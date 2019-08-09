import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { StoreProvider } from 'easy-peasy';
import { ConnectedRouter } from 'connected-react-router';
import { Provider } from 'react-redux';
import { createMemoryHistory, MemoryHistory } from 'history';
import { createReduxStore } from 'store';
import { useTranslation } from 'react-i18next';
import AppLayout from './AppLayout';

describe('AppLayout component', () => {
  let history: MemoryHistory;
  const renderComponent = (path?: string) => {
    history = createMemoryHistory();
    if (path) history.push(path);
    const store = createReduxStore();
    const app = (
      <StoreProvider store={store}>
        <Provider store={store as any}>
          <ConnectedRouter history={history}>
            <AppLayout>
              <p data-tid="hello">Hello World!</p>
            </AppLayout>
          </ConnectedRouter>
        </Provider>
      </StoreProvider>
    );

    return render(app);
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

  it('should contain a collapse trigger', () => {
    const { getByTestId } = renderComponent();
    expect(getByTestId('trigger')).toBeTruthy();
  });

  it('should be colappsed by default', () => {
    const { getByTestId } = renderComponent();
    expect(getByTestId('sider')).toHaveClass('ant-layout-sider-collapsed');
  });

  it('should expand menu when trigger clicked', () => {
    const { getByTestId } = renderComponent();
    fireEvent.click(getByTestId('trigger'));
    expect(getByTestId('sider')).not.toHaveClass('ant-layout-sider-collapsed');
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

  it('should navigate to counter page when Counter link clicked', () => {
    const { getByTestId } = renderComponent();
    fireEvent.click(getByTestId('nav-counter'));
    expect(history.location.pathname).toEqual('/counter');
  });

  it('should navigate to home page when logo clicked', () => {
    const { getByTestId } = renderComponent('/counter');
    fireEvent.click(getByTestId('logo'));
    expect(history.location.pathname).toEqual('/');
  });
});
