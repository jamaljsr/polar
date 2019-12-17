import React from 'react';
import { fireEvent, wait } from '@testing-library/dom';
import { Status } from 'shared/types';
import { initChartFromNetwork } from 'utils/chart';
import {
  getNetwork,
  lightningServiceMock,
  renderWithProviders,
  suppressConsoleErrors,
} from 'utils/tests';
import CreateInvoiceModal from './CreateInvoiceModal';

describe('CreateInvoiceModal', () => {
  const renderComponent = async (status?: Status) => {
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
        createInvoice: {
          visible: true,
          nodeName: 'alice',
        },
      },
    };
    const cmp = <CreateInvoiceModal network={network} />;
    const result = renderWithProviders(cmp, { initialState });
    return {
      ...result,
      network,
    };
  };

  it('should render labels', async () => {
    const { getByText } = await renderComponent();
    expect(getByText('Node')).toBeInTheDocument();
    expect(getByText('Amount (sats)')).toBeInTheDocument();
  });

  it('should render form inputs', async () => {
    const { getByLabelText } = await renderComponent();
    expect(getByLabelText('Node')).toBeInTheDocument();
    expect(getByLabelText('Amount (sats)')).toBeInTheDocument();
  });

  it('should render button', async () => {
    const { getByText } = await renderComponent();
    const btn = getByText('Create Invoice');
    expect(btn).toBeInTheDocument();
    expect(btn.parentElement).toBeInstanceOf(HTMLButtonElement);
  });

  it('should hide modal when cancel is clicked', async () => {
    const { getByText, store } = await renderComponent();
    const btn = getByText('Cancel');
    expect(btn).toBeInTheDocument();
    expect(btn.parentElement).toBeInstanceOf(HTMLButtonElement);
    await wait(() => fireEvent.click(getByText('Cancel')));
    expect(store.getState().modals.createInvoice.visible).toBe(false);
  });

  it('should display an error if form is not valid', async () => {
    await suppressConsoleErrors(async () => {
      const { getByText, getByLabelText } = await renderComponent();
      fireEvent.change(getByLabelText('Amount (sats)'), { target: { value: '' } });
      await wait(() => fireEvent.click(getByText('Create Invoice')));
      expect(getByText('required')).toBeInTheDocument();
    });
  });

  it('should do nothing if an invalid node is selected', async () => {
    const { getByText, getByLabelText, store } = await renderComponent();
    await wait(() => {
      store.getActions().modals.showCreateInvoice({ nodeName: 'invalid' });
    });
    fireEvent.change(getByLabelText('Amount (sats)'), { target: { value: '1000' } });
    await wait(() => fireEvent.click(getByText('Create Invoice')));
    expect(getByText('Create Invoice')).toBeInTheDocument();
  });

  describe('with form submitted', () => {
    beforeEach(() => {
      lightningServiceMock.createInvoice.mockResolvedValue('lnbc1invoice');
    });

    it('should create invoice successfully', async () => {
      const {
        getByText,
        getByLabelText,
        getByDisplayValue,
        store,
        network,
      } = await renderComponent();
      await wait(() => {
        store.getActions().modals.showCreateInvoice({ nodeName: 'alice' });
      });
      fireEvent.change(getByLabelText('Amount (sats)'), { target: { value: '1000' } });
      await wait(() => fireEvent.click(getByText('Create Invoice')));
      expect(getByText('Successfully Created the Invoice')).toBeInTheDocument();
      expect(getByDisplayValue('lnbc1invoice')).toBeInTheDocument();
      const node = network.nodes.lightning[0];
      expect(lightningServiceMock.createInvoice).toBeCalledWith(node, 1000, '');
    });

    it('should close the modal', async () => {
      const { getByText, getByLabelText, store } = await renderComponent();
      fireEvent.change(getByLabelText('Amount (sats)'), { target: { value: '1000' } });
      await wait(() => fireEvent.click(getByText('Create Invoice')));
      await wait(() => fireEvent.click(getByText('Copy & Close')));
      expect(store.getState().modals.createInvoice.visible).toBe(false);
      expect(getByText('Copied Invoice to the clipboard')).toBeInTheDocument();
    });

    it('should display an error when creating the invoice fails', async () => {
      lightningServiceMock.createInvoice.mockRejectedValue(new Error('error-msg'));
      const { getByText, getByLabelText } = await renderComponent();
      fireEvent.change(getByLabelText('Amount (sats)'), { target: { value: '1000' } });
      await wait(() => fireEvent.click(getByText('Create Invoice')));
      expect(getByText('Unable to create the Invoice')).toBeInTheDocument();
      expect(getByText('error-msg')).toBeInTheDocument();
    });
  });
});
