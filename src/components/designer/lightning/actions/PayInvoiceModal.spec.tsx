import React from 'react';
import { act, fireEvent, waitFor } from '@testing-library/react';
import { Status } from 'shared/types';
import { LightningNodeChannelAsset } from 'lib/lightning/types';
import { Network } from 'types';
import { initChartFromNetwork } from 'utils/chart';
import { defaultRepoState } from 'utils/constants';
import { createNetwork, mapToTapd } from 'utils/network';
import {
  defaultStateChannel,
  getNetwork,
  lightningServiceMock,
  renderWithProviders,
  suppressConsoleErrors,
  tapServiceMock,
  testManagedImages,
} from 'utils/tests';
import PayInvoiceModal from './PayInvoiceModal';

describe('PayInvoiceModal', () => {
  let unmount: () => void;
  let network: Network;

  beforeEach(() => {
    network = getNetwork(1, 'test network');
  });

  const renderComponent = async (nodeName = 'alice') => {
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
    unmount = result.unmount;
    return result;
  };

  afterEach(() => unmount());

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
    await waitFor(() => {
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
    const { getByText, findByText, getByLabelText } = await renderComponent('invalid');
    fireEvent.change(getByLabelText('BOLT 11 Invoice'), { target: { value: 'lnbc1' } });
    fireEvent.click(getByText('Pay Invoice'));
    expect(await findByText('Pay Invoice')).toBeInTheDocument();
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
      const { getByText, getByLabelText, store } = await renderComponent();
      fireEvent.change(getByLabelText('BOLT 11 Invoice'), { target: { value: 'lnbc1' } });
      fireEvent.click(getByText('Pay Invoice'));
      await waitFor(() => {
        expect(store.getState().modals.payInvoice.visible).toBe(false);
      });
      const node = network.nodes.lightning[0];
      expect(lightningServiceMock.payInvoice).toHaveBeenCalledWith(
        node,
        'lnbc1',
        undefined,
      );
    });

    it('should display an error when paying the invoice fails', async () => {
      lightningServiceMock.payInvoice.mockRejectedValue(new Error('error-msg'));
      const { getByText, findByText, getByLabelText } = await renderComponent();
      fireEvent.change(getByLabelText('BOLT 11 Invoice'), { target: { value: 'lnbc1' } });
      fireEvent.click(getByText('Pay Invoice'));
      expect(await findByText('Unable to pay the Invoice')).toBeInTheDocument();
      expect(await findByText('error-msg')).toBeInTheDocument();
    });
  });

  describe('with assets', () => {
    beforeEach(() => {
      network = createNetwork({
        id: 1,
        name: 'test network',
        description: 'network description',
        lndNodes: 0,
        clightningNodes: 0,
        eclairNodes: 0,
        bitcoindNodes: 1,
        tapdNodes: 0,
        litdNodes: 3,
        status: Status.Started,
        repoState: defaultRepoState,
        managedImages: testManagedImages,
        customImages: [],
      });
      const asset: LightningNodeChannelAsset = {
        id: 'abcd',
        name: 'test asset',
        capacity: '1000',
        localBalance: '600',
        remoteBalance: '400',
      };
      lightningServiceMock.getChannels.mockResolvedValue([
        defaultStateChannel({ assets: [asset] }),
      ]);
      lightningServiceMock.decodeInvoice.mockResolvedValue({
        paymentHash: 'pmt-hash',
        amountMsat: '400000',
        expiry: '123456',
      });
      tapServiceMock.assetRoots.mockResolvedValue([
        { id: 'abcd', name: 'test asset', rootSum: 100 },
      ]);
      tapServiceMock.sendPayment.mockResolvedValue({
        preimage: 'preimage',
        amount: 1000,
        destination: 'asdf',
      });
    });

    it('should display the asset dropdown', async () => {
      const { findByText, getByText } = await renderComponent('bob');
      expect(await findByText('From Node')).toBeInTheDocument();
      expect(getByText('Asset to Send')).toBeInTheDocument();
    });

    it('should pay any asset invoice successfully', async () => {
      const { findByText, getByText, getByLabelText, store, changeSelect } =
        await renderComponent('bob');
      expect(await findByText('From Node')).toBeInTheDocument();
      fireEvent.change(getByLabelText('BOLT 11 Invoice'), { target: { value: 'lnbc1' } });
      changeSelect('Asset to Send', 'test asset');
      fireEvent.click(getByText('Pay Invoice'));
      await waitFor(() => {
        expect(store.getState().modals.payInvoice.visible).toBe(false);
      });
      const node = network.nodes.lightning[1];
      const tapdNode = mapToTapd(node);
      expect(tapServiceMock.sendPayment).toHaveBeenCalledWith(
        tapdNode,
        'abcd',
        'lnbc1',
        400000,
        '',
      );
    });
  });
});
