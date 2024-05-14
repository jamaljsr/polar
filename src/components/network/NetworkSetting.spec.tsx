import React from 'react';
import { injections, renderWithProviders } from 'utils/tests';
import NetworkSetting from './NetworkSetting';
import { fireEvent, waitFor } from '@testing-library/react';
import { HOME } from 'components/routing';

const mockSettingsService = injections.settingsService as jest.Mocked<
  typeof injections.settingsService
>;

describe('NetworkSetting Component', () => {
  const renderComponent = () => {
    const initialState = {
      app: {
        settings: {
          basePorts: {
            LND: {
              rest: 8081,
            },
            'c-lightning': {
              grpc: 11001,
            },
            eclair: {
              rest: 8281,
            },
            tapd: {
              grpc: 12029,
            },
          },
        },
      },
    };
    const result = renderWithProviders(<NetworkSetting />, { initialState });

    return {
      ...result,
      saveBtn: result.getAllByText('Save')[0].parentElement as Element,
      lndInput: result.getAllByLabelText('LND')[0],
    };
  };

  it('should contain a input field for LND port', () => {
    const { lndInput } = renderComponent();
    expect(lndInput).toHaveValue('8081');
  });

  it('should have a save button', () => {
    const { saveBtn } = renderComponent();
    expect(saveBtn).toBeInTheDocument();
  });

  it('should handle back button click', async () => {
    const { getByLabelText, history } = renderComponent();
    fireEvent.click(getByLabelText('arrow-left'));
    expect(history.location.pathname).toEqual(HOME);
  });

  it('should save settings when save button is clicked', async () => {
    const { saveBtn, injections } = renderComponent();
    fireEvent.click(saveBtn);
    await waitFor(() => expect(injections.settingsService.save).toBeCalled());
  });

  it('should have the correct default ports', async () => {
    const { getByLabelText, getAllByLabelText } = renderComponent();
    expect(getAllByLabelText('LND')[0]).toHaveValue('8081');
    expect(getAllByLabelText('Core Lightning')[0]).toHaveValue('8181');
    expect(getAllByLabelText('Taproot Assets')[0]).toHaveValue('8289');
    expect(getByLabelText('Eclair')).toHaveValue('8281');
    expect(getByLabelText('Bitcoin Core')).toHaveValue('18443');
    expect(getAllByLabelText('LND')[1]).toHaveValue('10001');
    expect(getAllByLabelText('Core Lightning')[1]).toHaveValue('11001');
    expect(getAllByLabelText('Taproot Assets')[1]).toHaveValue('12029');
  });

  it('should display an error if save fails', async () => {
    mockSettingsService.save.mockRejectedValue(new Error('asdf'));
    const { saveBtn, findByText, lndInput } = renderComponent();
    fireEvent.change(lndInput, { target: { value: 'asdf' } });
    fireEvent.click(saveBtn);
    expect(await findByText('Unable to save the ports')).toBeInTheDocument();
    expect(await findByText('asdf')).toBeInTheDocument();
  });
});
