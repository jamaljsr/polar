import React from 'react';
import { act, fireEvent, wait } from '@testing-library/react';
import { Status } from 'shared/types';
import { initChartFromNetwork } from 'utils/chart';
import {
  getNetwork,
  lightningServiceMock,
  renderWithProviders,
  suppressConsoleErrors,
} from 'utils/tests';
import PayInvoiceModal from './PayInvoiceModal';

describe('PayInvoiceModal', () => {
  const renderComponent = async (status?: Status, nodeName = 'alice') => {
    const network = getNetwork(1, 'test network', status);
    const initialState = {
      network: {
        networks: [network],
      },
      designer: {
        activeId: network.id,
        allCharts: {
          [network.id]: initChartFromNetwork(network),
        },
      },
      modals: {
        payInvoice: {
          visible: true,
          nodeName,
        },
      },
    };
    const cmp = <PayInvoiceModal network={network} />;
    const result = renderWithProviders(cmp, { initialState });
    return {
      ...result,
      network,
    };
  };

  it('should render labels', async () => {
    const { getByText } = await renderComponent();
    expect(getByText('From Node')).toBeInTheDocument();
    expect(getByText('BOLT 11 Invoice')).toBeInTheDocument();
  });

  it('should render form inputs', async () => {
    const { getByLabelText } = await renderComponent();
    expect(getByLabelText('From Node')).toBeInTheDocument();
    expect(getByLabelText('BOLT 11 Invoice')).toBeInTheDocument();
  });

  it('should render button', async () => {
    const { getByText } = await renderComponent();
    const btn = getByText('Pay Invoice');
    expect(btn).toBeInTheDocument();
    expect(btn.parentElement).toBeInstanceOf(HTMLButtonElement);
  });

  it('should hide modal when cancel is clicked', async () => {
    const { getByText, queryByText } = await renderComponent();
    const btn = getByText('Cancel');
    expect(btn).toBeInTheDocument();
    expect(btn.parentElement).toBeInstanceOf(HTMLButtonElement);
    fireEvent.click(getByText('Cancel'));
    await wait(() => {
      expect(queryByText('Cancel')).not.toBeInTheDocument();
    });
  });

  it('should display an error if form is not valid', async () => {
    await suppressConsoleErrors(async () => {
      const { getByText, findByText, store } = await renderComponent();
      act(() => store.getActions().modals.showPayInvoice({}));
      fireEvent.click(getByText('Pay Invoice'));
      expect(await findByText('required')).toBeInTheDocument();
    });
  });

  it('should do nothing if an invalid node is selected', async () => {
    const { getByText, getByLabelText } = await renderComponent(
      Status.Stopped,
      'invalid',
    );
    fireEvent.change(getByLabelText('BOLT 11 Invoice'), { target: { value: 'lnbc1' } });
    await wait(() => fireEvent.click(getByText('Pay Invoice')));
    expect(getByText('Pay Invoice')).toBeInTheDocument();
  });

  describe('with form submitted', () => {
    beforeEach(() => {
      lightningServiceMock.payInvoice.mockResolvedValue({
        preimage: 'preimage',
        amount: 1000,
        destination: 'asdf',
      });
    });

    it('should pay invoice successfully', async () => {
      const { getByText, getByLabelText, store, network } = await renderComponent();
      fireEvent.change(getByLabelText('BOLT 11 Invoice'), { target: { value: 'lnbc1' } });
      fireEvent.click(getByText('Pay Invoice'));
      await wait(() => {
        expect(store.getState().modals.payInvoice.visible).toBe(false);
      });
      const node = network.nodes.lightning[0];
      expect(lightningServiceMock.payInvoice).toBeCalledWith(node, 'lnbc1', undefined);
    });

    it('should display an error when paying the invoice fails', async () => {
      lightningServiceMock.payInvoice.mockRejectedValue(new Error('error-msg'));
      const { getByText, getByLabelText } = await renderComponent();
      fireEvent.change(getByLabelText('BOLT 11 Invoice'), { target: { value: 'lnbc1' } });
      await wait(() => fireEvent.click(getByText('Pay Invoice')));
      expect(getByText('Unable to pay the Invoice')).toBeInTheDocument();
      expect(getByText('error-msg')).toBeInTheDocument();
    });
  });
});
