import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { StoreProvider } from 'easy-peasy';
import { ConnectedRouter } from 'connected-react-router';
import { Provider } from 'react-redux';
import { createMemoryHistory, MemoryHistory } from 'history';

import { createReduxStore } from 'store';
import NewNetwork from './NewNetwork';

describe('NewNetwork component', () => {
  let history: MemoryHistory;
  const mockNetworkManager = {
    create: jest.fn(),
  };
  const renderComponent = () => {
    history = createMemoryHistory();
    history.push('/network');
    const store = createReduxStore(
      {},
      {
        networkManager: mockNetworkManager,
      },
    );
    const app = (
      <StoreProvider store={store}>
        <Provider store={store as any}>
          <ConnectedRouter history={history}>
            <NewNetwork />
          </ConnectedRouter>
        </Provider>
      </StoreProvider>
    );
    return render(app);
  };

  it('should contain a input field for name', () => {
    const { getByTestId } = renderComponent();
    expect(getByTestId('name')).toHaveValue('');
  });

  it('should have a Create button', () => {
    const { getByTestId } = renderComponent();
    expect(getByTestId('submit')).toHaveTextContent('Create');
  });

  it('should display an error if empty name is submitted', () => {
    const { getByTestId, getByText } = renderComponent();
    fireEvent.click(getByTestId('submit'));
    expect(getByText('name is required')).toBeTruthy();
  });

  describe('with valid submission', () => {
    it('should display a notification', () => {
      const { getByTestId, findByText } = renderComponent();
      const nameInput = getByTestId('name');
      fireEvent.change(nameInput, { target: { value: 'test' } });
      fireEvent.click(getByTestId('submit'));
      expect(findByText('Created test network successfuly')).toBeTruthy();
    });

    it('should navigate to home page', () => {
      const { getByTestId } = renderComponent();
      const nameInput = getByTestId('name');
      fireEvent.change(nameInput, { target: { value: 'test' } });
      fireEvent.click(getByTestId('submit'));
      expect(history.location.pathname).toEqual('/');
    });

    it('should call networkManager.create', () => {
      const { getByTestId } = renderComponent();
      const nameInput = getByTestId('name');
      fireEvent.change(nameInput, { target: { value: 'test' } });
      fireEvent.click(getByTestId('submit'));
      expect(mockNetworkManager.create).toBeCalled();
    });
  });
});
