import React from 'react';
import { fireEvent, waitForDomChange } from '@testing-library/react';
import os from 'os';
import { renderWithProviders, suppressConsoleErrors } from 'utils/tests';
import { HOME, NETWORK_VIEW } from 'components/routing';
import NewNetwork from './NewNetwork';

jest.mock('os');

const mockOS = os as jest.Mocked<typeof os>;

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

  it('should handle back button click', async () => {
    const { getByLabelText, history } = renderComponent();
    fireEvent.click(getByLabelText('arrow-left'));
    expect(history.location.pathname).toEqual(HOME);
  });

  it('should display an error if empty name is submitted', async () => {
    await suppressConsoleErrors(async () => {
      const { getByText, createBtn } = renderComponent();
      fireEvent.click(createBtn);
      await waitForDomChange();
      expect(getByText('required')).toBeInTheDocument();
    });
  });

  it('should have the correct default nodes', () => {
    mockOS.platform.mockReturnValue('darwin');
    const { getByLabelText } = renderComponent();
    expect(getByLabelText('How many LND nodes?')).toHaveValue('2');
    expect(getByLabelText('How many c-lightning nodes?')).toHaveValue('1');
    expect(getByLabelText('How many bitcoind nodes?')).toHaveValue('1');
  });

  it('should disable c-lightning input on Windows', () => {
    mockOS.platform.mockReturnValue('win32');
    const { getByLabelText, getByText } = renderComponent();
    expect(getByLabelText('How many c-lightning nodes?')).toHaveValue('0');
    expect(getByLabelText('How many LND nodes?')).toHaveValue('3');
    expect(getByText('Not supported on Windows yet.')).toBeInTheDocument();
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
      expect(injections.dockerService.saveComposeFile).toBeCalled();
    });
  });
});
