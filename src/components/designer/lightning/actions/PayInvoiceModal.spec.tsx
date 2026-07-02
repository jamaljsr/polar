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
  defaultStateInfo,
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
    lightningServiceMock.getBalances.mockResolvedValue({
      confirmed: '1000',
      total: '1000',
      unconfirmed: '0',
    });
    lightningServiceMock.getChannels.mockResolvedValue([
      defaultStateChannel({
        uniqueId: 'channel-1',
        localBalance: '1000',
        remoteBalance: '0',
      }),
    ]);
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
    if (nodeName !== 'invalid') {
      await result.findByLabelText('BOLT 11 Invoice');
    }
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

    it('should pay invoice successfully and show correctly formatted success message', async () => {
      const { getByText, getByLabelText, store, findByText } = await renderComponent();
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
      const element = await findByText('Sent 1,000 sats from alice');
      expect(element).toBeInTheDocument();
    });

    it('should display an error when paying the invoice fails', async () => {
      lightningServiceMock.payInvoice.mockRejectedValue(new Error('error-msg'));
      const { getByText, findByText, getByLabelText } = await renderComponent();
      fireEvent.change(getByLabelText('BOLT 11 Invoice'), { target: { value: 'lnbc1' } });
      fireEvent.click(getByText('Pay Invoice'));
      expect(await findByText('Unable to pay the Invoice')).toBeInTheDocument();
      expect(await findByText('error-msg')).toBeInTheDocument();
    });

    it('should disable the pay button and display a warning when the node has no funds available to pay the invoice', async () => {
      lightningServiceMock.getBalances.mockResolvedValue({
        confirmed: '0',
        total: '0',
        unconfirmed: '0',
      });
      lightningServiceMock.getChannels.mockResolvedValue([
        defaultStateChannel({
          uniqueId: 'channel-1',
          localBalance: '0',
          remoteBalance: '1000',
        }),
      ]);
      const { findByText, getByText } = await renderComponent();
      expect(getByText('Pay Invoice').closest('button')).toBeDisabled();
      expect(
        await findByText(
          'Node has no funds available to pay invoices. Fund the node or open a channel with outbound liquidity and try again.',
        ),
      ).toBeInTheDocument();
      expect(lightningServiceMock.payInvoice).not.toHaveBeenCalled();
    });

    it('should enable the pay button when the only funded channel was opened by a peer', async () => {
      // Regression test: a channel opened by a peer only appears in that peer's
      // channel list (as remoteBalance), so the selected node's own getChannels
      // is empty. Its outbound liquidity must still be recognized.
      lightningServiceMock.getInfo.mockImplementation(async n =>
        defaultStateInfo({ pubkey: `${n.name}-pubkey` }),
      );
      lightningServiceMock.getChannels.mockImplementation(async n =>
        n.name === 'bob'
          ? [
              defaultStateChannel({
                uniqueId: 'channel-1',
                pubkey: 'alice-pubkey', // bob opened this channel to alice
                localBalance: '1000',
                remoteBalance: '500',
              }),
            ]
          : [],
      );
      const { getByText, queryByText } = await renderComponent('alice');
      expect(getByText('Pay Invoice').closest('button')).not.toBeDisabled();
      expect(
        queryByText(
          'Node has no funds available to pay invoices. Fund the node or open a channel with outbound liquidity and try again.',
        ),
      ).not.toBeInTheDocument();
    });

    it('should disable the pay button if the only channels with funds are pending, closed, or have invalid balance', async () => {
      lightningServiceMock.getBalances.mockResolvedValue({
        confirmed: '0',
        total: '0',
        unconfirmed: '0',
      });
      lightningServiceMock.getChannels.mockResolvedValue([
        defaultStateChannel({
          uniqueId: 'channel-1',
          localBalance: '1000',
          remoteBalance: '0',
          pending: true,
        }),
        defaultStateChannel({
          uniqueId: 'channel-2',
          localBalance: '1000',
          remoteBalance: '0',
          status: 'Closed',
        }),
        defaultStateChannel({
          uniqueId: 'channel-3',
          localBalance: 'not-a-number',
          remoteBalance: '0',
        }),
      ]);
      const { findByText, getByText } = await renderComponent();
      expect(getByText('Pay Invoice').closest('button')).toBeDisabled();
      expect(
        await findByText(
          'Node has no funds available to pay invoices. Fund the node or open a channel with outbound liquidity and try again.',
        ),
      ).toBeInTheDocument();
      expect(lightningServiceMock.payInvoice).not.toHaveBeenCalled();
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
        manualMineCount: 6,
      });
      const asset: LightningNodeChannelAsset = {
        id: 'abcd',
        name: 'test asset',
        capacity: '1000',
        localBalance: '600',
        remoteBalance: '400',
        decimals: 0,
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
