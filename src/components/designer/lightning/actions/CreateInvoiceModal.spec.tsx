import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react';
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
  let unmount: () => void;

  const renderComponent = async (status?: Status, nodeName = 'alice') => {
    const network = getNetwork(1, 'test network', status?.toString());
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
          nodeName,
        },
      },
    };
    const cmp = <CreateInvoiceModal network={network} />;
    const result = renderWithProviders(cmp, { initialState, wrapForm: true });
    unmount = result.unmount;
    return {
      ...result,
      network,
    };
  };

  afterEach(() => unmount());

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
    fireEvent.click(getByText('Cancel'));
    expect(store.getState().modals.createInvoice.visible).toBe(false);
  });

  it('should display an error if form is not valid', async () => {
    await suppressConsoleErrors(async () => {
      const { getByText, getByLabelText, findByText } = await renderComponent();
      fireEvent.change(getByLabelText('Amount (sats)'), { target: { value: '' } });
      fireEvent.blur(getByLabelText('Amount (sats)'));
      fireEvent.click(getByText('Create Invoice'));
      expect(await findByText('required')).toBeInTheDocument();
    });
  });

  it('should do nothing if an invalid node is selected', async () => {
    const { getByText, getByLabelText } = await renderComponent(
      Status.Stopped,
      'invalid',
    );
    fireEvent.change(getByLabelText('Amount (sats)'), { target: { value: '1000' } });
    fireEvent.click(getByText('Create Invoice'));
    expect(getByText('Create Invoice')).toBeInTheDocument();
  });

  describe('with form submitted', () => {
    beforeEach(() => {
      lightningServiceMock.createInvoice.mockResolvedValue('lnbc1invoice');
    });

    it('should create invoice successfully', async () => {
      const { getByText, getByLabelText, getByDisplayValue, findByText, store, network } =
        await renderComponent();
      await waitFor(() => {
        store.getActions().modals.showCreateInvoice({ nodeName: 'alice' });
      });
      fireEvent.change(getByLabelText('Amount (sats)'), { target: { value: '1000' } });
      fireEvent.click(getByText('Create Invoice'));
      expect(await findByText('Successfully Created the Invoice')).toBeInTheDocument();
      expect(getByDisplayValue('lnbc1invoice')).toBeInTheDocument();
      const node = network.nodes.lightning[0];
      expect(lightningServiceMock.createInvoice).toBeCalledWith(node, 1000, '');
    });

    it('should close the modal', async () => {
      const { getByText, findByText, getByLabelText, store } = await renderComponent();
      fireEvent.change(getByLabelText('Amount (sats)'), { target: { value: '1000' } });
      fireEvent.click(getByText('Create Invoice'));
      fireEvent.click(await findByText('Copy & Close'));
      expect(store.getState().modals.createInvoice.visible).toBe(false);
      expect(getByText('Copied Invoice to the clipboard')).toBeInTheDocument();
    });

    it('should display an error when creating the invoice fails', async () => {
      lightningServiceMock.createInvoice.mockRejectedValue(new Error('error-msg'));
      const { getByText, findByText, getByLabelText } = await renderComponent();
      fireEvent.change(getByLabelText('Amount (sats)'), { target: { value: '1000' } });
      // await waitFor(() => );
      fireEvent.click(getByText('Create Invoice'));
      expect(await findByText('Unable to create the Invoice')).toBeInTheDocument();
      expect(await findByText('error-msg')).toBeInTheDocument();
    });
  });
});
