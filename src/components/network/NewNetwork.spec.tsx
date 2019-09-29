import React from 'react';
import { fireEvent, waitForDomChange } from '@testing-library/react';
import { renderWithProviders } from 'utils/tests';
import { NETWORK_VIEW } from 'components/routing';
import NewNetwork from './NewNetwork';

describe('NewNetwork component', () => {
  const renderComponent = () => {
    const result = renderWithProviders(<NewNetwork />);
    return {
      ...result,
      createBtn: result.getByText('Create').parentElement as Element,
      nameInput: result.getByLabelText('Network Name'),
    };
  };

  it('should contain a input field for name', () => {
    const { nameInput } = renderComponent();
    expect(nameInput).toHaveValue('');
  });

  it('should have a submit button', () => {
    const { createBtn } = renderComponent();
    expect(createBtn).toBeInTheDocument();
  });

  it('should display an error if empty name is submitted', () => {
    const { getByText, createBtn } = renderComponent();
    fireEvent.click(createBtn);
    expect(getByText('name is required')).toBeInTheDocument();
  });

  describe('with valid submission', () => {
    it('should navigate to home page', async () => {
      const { createBtn, nameInput, history } = renderComponent();
      fireEvent.change(nameInput, { target: { value: 'test' } });
      fireEvent.click(createBtn);
      await waitForDomChange();
      expect(history.location.pathname).toEqual(NETWORK_VIEW(1));
    });

    it('should call networkManager.create', async () => {
      const { createBtn, nameInput, injections } = renderComponent();
      fireEvent.change(nameInput, { target: { value: 'test' } });
      fireEvent.click(createBtn);
      await waitForDomChange();
      expect(injections.dockerService.create).toBeCalled();
    });
  });
});
