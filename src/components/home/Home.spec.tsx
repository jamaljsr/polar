import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { StoreProvider } from 'easy-peasy';
import { ConnectedRouter } from 'connected-react-router';
import { Provider } from 'react-redux';
import { createMemoryHistory } from 'history';
import { createReduxStore } from 'store';
import Home from './Home';

describe('Home component', () => {
  const renderComponent = () => {
    const store = createReduxStore();
    const app = (
      <StoreProvider store={store}>
        <Provider store={store as any}>
          <ConnectedRouter history={createMemoryHistory()}>
            <Home />
          </ConnectedRouter>
        </Provider>
      </StoreProvider>
    );

    return render(app);
  };

  it('should contain a "Click Me!" button', () => {
    const { getByTestId } = renderComponent();
    expect(getByTestId('me-btn')).toHaveTextContent('cmps.home.me-btn');
  });

  it('should contain a link to Counter page', () => {
    const { getByTestId } = renderComponent();
    expect(getByTestId('counter-link')).toHaveTextContent('Counter');
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
