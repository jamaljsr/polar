import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react';
import os from 'os';
import { CustomImage } from 'types';
import { injections, renderWithProviders, suppressConsoleErrors } from 'utils/tests';
import { HOME, NETWORK_VIEW } from 'components/routing';
import NewNetwork from './NewNetwork';

jest.mock('os');

const mockOS = os as jest.Mocked<typeof os>;
const mockDockerService = injections.dockerService as jest.Mocked<
  typeof injections.dockerService
>;

describe('NewNetwork component', () => {
  const customImages: CustomImage[] = [
    {
      id: '123',
      name: 'My Test Image',
      implementation: 'c-lightning',
      dockerImage: 'custom:image',
      command: 'test-command',
    },
  ];
  const renderComponent = (withCustom = false) => {
    const initialState = {
      app: {
        settings: {
          nodeImages: {
            custom: withCustom ? customImages : [],
          },
        },
      },
    };
    const result = renderWithProviders(<NewNetwork />, { initialState });
    return {
      ...result,
      createBtn: result.getAllByText('Create Network')[0].parentElement as Element,
      nameInput: result.getByLabelText('Network Name'),
      descriptionInput: result.getByLabelText('Network Description'),
    };
  };

  it('should contain an input field for name', () => {
    const { nameInput } = renderComponent();
    expect(nameInput).toHaveValue('');
  });

  it('should contain an input field for description', () => {
    const { descriptionInput } = renderComponent();
    expect(descriptionInput).toHaveValue('');
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
      const { findByText, createBtn } = renderComponent();
      fireEvent.click(createBtn);
      expect(await findByText('required')).toBeInTheDocument();
    });
  });

  it('should have the correct default nodes', () => {
    mockOS.platform.mockReturnValue('darwin');
    const { getByLabelText, queryByText } = renderComponent();
    expect(getByLabelText('LND')).toHaveValue('1');
    expect(getByLabelText('Core Lightning')).toHaveValue('1');
    expect(getByLabelText('Eclair')).toHaveValue('1');
    expect(getByLabelText('Bitcoin Core')).toHaveValue('1');
    expect(queryByText('My Test Image')).not.toBeInTheDocument();
  });

  it('should display custom nodes', () => {
    const { getByLabelText } = renderComponent(true);
    expect(getByLabelText('My Test Image')).toHaveValue('0');
  });

  it('should disable c-lightning input on Windows', () => {
    mockOS.platform.mockReturnValue('win32');
    const { getByLabelText, getByText } = renderComponent();
    expect(getByLabelText('Core Lightning')).toBeDisabled();
    expect(getByText('Not supported on Windows yet.')).toBeInTheDocument();
  });

  describe('with valid submission', () => {
    it('should navigate to home page', async () => {
      const { createBtn, nameInput, descriptionInput, history } = renderComponent();
      fireEvent.change(nameInput, { target: { value: 'test' } });
      fireEvent.change(descriptionInput, { target: { value: 'description' } });
      fireEvent.click(createBtn);
      await waitFor(() => {
        expect(history.location.pathname).toEqual(NETWORK_VIEW(1));
      });
    });

    it('should call networkManager.create', async () => {
      const { createBtn, nameInput, descriptionInput, injections } = renderComponent();
      fireEvent.change(nameInput, { target: { value: 'test' } });
      fireEvent.change(descriptionInput, { target: { value: 'description' } });
      fireEvent.click(createBtn);
      await waitFor(() => {
        expect(injections.dockerService.saveComposeFile).toHaveBeenCalled();
      });
    });

    it('should display an error if the submission fails', async () => {
      mockDockerService.saveComposeFile.mockRejectedValue(new Error('asdf'));
      const { createBtn, nameInput, descriptionInput, findByText } = renderComponent();
      fireEvent.change(nameInput, { target: { value: 'test' } });
      fireEvent.change(descriptionInput, { target: { value: 'description' } });
      fireEvent.click(createBtn);
      expect(await findByText('Unable to create the new network')).toBeInTheDocument();
      expect(await findByText('asdf')).toBeInTheDocument();
    });

    it('should show an error when there are move tapd than LND node chosen', async () => {
      const { nameInput, descriptionInput, createBtn, getByLabelText, findByText } =
        renderComponent();
      fireEvent.change(nameInput, { target: { value: 'test' } });
      fireEvent.change(descriptionInput, { target: { value: 'description' } });
      fireEvent.change(getByLabelText('LND'), { target: { value: 1 } });
      fireEvent.change(getByLabelText('Taproot Assets'), { target: { value: 2 } });
      fireEvent.click(createBtn);
      expect(await findByText('Unable to create the new network')).toBeInTheDocument();
      expect(
        await findByText(
          'The number of Taproot Assets nodes must be less than or equal to the number of LND nodes',
        ),
      ).toBeInTheDocument();
    });
  });
});
