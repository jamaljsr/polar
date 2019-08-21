import React from 'react';
import { fireEvent } from '@testing-library/react';
import { renderWithProviders } from 'utils/tests';
import NewNetwork from './NewNetwork';

describe('NewNetwork component', () => {
  const renderComponent = () => {
    return renderWithProviders(<NewNetwork />);
  };

  it('should contain a input field for name', () => {
    const { getByTestId } = renderComponent();
    expect(getByTestId('name')).toHaveValue('');
  });

  it('should have a submit button', () => {
    const { getByTestId } = renderComponent();
    expect(getByTestId('submit')).toHaveTextContent('cmps.new-network.btn-create');
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
      const { getByTestId, history } = renderComponent();
      const nameInput = getByTestId('name');
      fireEvent.change(nameInput, { target: { value: 'test' } });
      fireEvent.click(getByTestId('submit'));
      expect(history.location.pathname).toEqual('/');
    });

    it('should call networkManager.create', () => {
      const { getByTestId, injections } = renderComponent();
      const nameInput = getByTestId('name');
      fireEvent.change(nameInput, { target: { value: 'test' } });
      fireEvent.click(getByTestId('submit'));
      expect(injections.networkManager.create).toBeCalled();
    });
  });
});
