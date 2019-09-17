import React from 'react';
import { fireEvent, waitForDomChange } from '@testing-library/react';
import { renderWithProviders } from 'utils/tests';
import { NETWORK_VIEW } from 'components/routing';
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
    expect(getByText('name is required')).toBeInTheDocument();
  });

  describe('with valid submission', () => {
    it('should display a notification', async () => {
      const { getByTestId, findByText } = renderComponent();
      const nameInput = getByTestId('name');
      fireEvent.change(nameInput, { target: { value: 'test' } });
      fireEvent.click(getByTestId('submit'));
      expect(await findByText('cmps.new-network.success-msg: test')).toBeInTheDocument();
    });

    it('should navigate to home page', async () => {
      const { getByTestId, history } = renderComponent();
      const nameInput = getByTestId('name');
      fireEvent.change(nameInput, { target: { value: 'test' } });
      fireEvent.click(getByTestId('submit'));
      await waitForDomChange();
      expect(history.location.pathname).toEqual(NETWORK_VIEW(1));
    });

    it('should call networkManager.create', async () => {
      const { getByTestId, injections } = renderComponent();
      const nameInput = getByTestId('name');
      fireEvent.change(nameInput, { target: { value: 'test' } });
      fireEvent.click(getByTestId('submit'));
      await waitForDomChange();
      expect(injections.dockerService.create).toBeCalled();
    });
  });
});
