import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react';
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
import CreateInvoiceModal from './CreateInvoiceModal';

describe('CreateInvoiceModal', () => {
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
        createInvoice: {
          visible: true,
          nodeName,
        },
      },
    };
    const cmp = <CreateInvoiceModal network={network} />;
    const result = renderWithProviders(cmp, { initialState, wrapForm: true });
    unmount = result.unmount;
    return result;
  };

  afterEach(() => unmount());

  it('should render labels', async () => {
    const { getByText } = await renderComponent();
    expect(getByText('Node')).toBeInTheDocument();
    expect(getByText('Amount')).toBeInTheDocument();
  });

  it('should render form inputs', async () => {
    const { getByLabelText } = await renderComponent();
    expect(getByLabelText('Node')).toBeInTheDocument();
    expect(getByLabelText('Amount')).toBeInTheDocument();
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
      fireEvent.change(getByLabelText('Amount'), { target: { value: '' } });
      fireEvent.blur(getByLabelText('Amount'));
      fireEvent.click(getByText('Create Invoice'));
      expect(await findByText('required')).toBeInTheDocument();
    });
  });

  it('should do nothing if an invalid node is selected', async () => {
    const { getByText, getByLabelText } = await renderComponent('invalid');
    fireEvent.change(getByLabelText('Amount'), { target: { value: '1000' } });
    fireEvent.click(getByText('Create Invoice'));
    expect(getByText('Create Invoice')).toBeInTheDocument();
  });

  describe('with form submitted', () => {
    beforeEach(() => {
      lightningServiceMock.createInvoice.mockResolvedValue('lnbc1invoice');
    });

    it('should create invoice successfully', async () => {
      const { getByText, getByLabelText, getByDisplayValue, findByText, store } =
        await renderComponent();
      await waitFor(() => {
        store.getActions().modals.showCreateInvoice({ nodeName: 'alice' });
      });
      fireEvent.change(getByLabelText('Amount'), { target: { value: '1000' } });
      fireEvent.click(getByText('Create Invoice'));
      expect(await findByText('Successfully Created the Invoice')).toBeInTheDocument();
      expect(getByDisplayValue('lnbc1invoice')).toBeInTheDocument();
      const node = network.nodes.lightning[0];
      expect(lightningServiceMock.createInvoice).toHaveBeenCalledWith(node, 1000, '');
    });

    it('should close the modal', async () => {
      const { getByText, findByText, getByLabelText, store } = await renderComponent();
      fireEvent.change(getByLabelText('Amount'), { target: { value: '1000' } });
      fireEvent.click(getByText('Create Invoice'));
      fireEvent.click(await findByText('Copy & Close'));
      expect(store.getState().modals.createInvoice.visible).toBe(false);
      expect(getByText('Copied Invoice to the clipboard')).toBeInTheDocument();
    });

    it('should display an error when creating the invoice fails', async () => {
      lightningServiceMock.createInvoice.mockRejectedValue(new Error('error-msg'));
      const { getByText, findByText, getByLabelText } = await renderComponent();
      fireEvent.change(getByLabelText('Amount'), { target: { value: '1000' } });
      fireEvent.click(getByText('Create Invoice'));
      expect(await findByText('Unable to create the Invoice')).toBeInTheDocument();
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
        amountMsat: '20000',
        expiry: '3600',
        paymentHash: 'payment-hash',
      });
      tapServiceMock.assetRoots.mockResolvedValue([
        { id: 'abcd', name: 'test asset', rootSum: 100 },
      ]);
      tapServiceMock.addInvoice.mockResolvedValue('lnbc1invoice');
    });

    it('should display the asset dropdown', async () => {
      const { findByText, getByText } = await renderComponent();
      expect(await findByText('Node')).toBeInTheDocument();
      expect(getByText('Amount')).toBeInTheDocument();
      expect(getByText('Asset to Receive')).toBeInTheDocument();
    });

    it('should update amount when an asset is selected', async () => {
      const { findByText, getByLabelText, changeSelect } = await renderComponent();
      expect(await findByText('Node')).toBeInTheDocument();
      expect(getByLabelText('Amount')).toHaveValue('1,000,000');
      expect(await findByText('Asset to Receive')).toBeInTheDocument();
      // select the asset
      changeSelect('Asset to Receive', 'test asset');
      expect(getByLabelText('Amount')).toHaveValue('200'); // half of the remote balance
      // select sats
      changeSelect('Asset to Receive', 'Bitcoin (sats)');
      expect(getByLabelText('Amount')).toHaveValue('1,000,000');
    });

    it('should create an asset invoice successfully', async () => {
      const { getByText, getByDisplayValue, findByText, changeSelect } =
        await renderComponent();
      expect(await findByText('Node')).toBeInTheDocument();
      changeSelect('Asset to Receive', 'test asset');
      fireEvent.click(getByText('Create Invoice'));
      expect(await findByText('Successfully Created the Invoice')).toBeInTheDocument();
      expect(getByDisplayValue('lnbc1invoice')).toBeInTheDocument();
      const node = network.nodes.lightning[0];
      const tapNode = mapToTapd(node);
      expect(tapServiceMock.addInvoice).toHaveBeenCalledWith(
        tapNode,
        'abcd',
        200,
        '',
        3600,
      );
    });

    it('should display an error when creating an asset invoice with a high balance', async () => {
      const { getByText, getByLabelText, findByText, changeSelect } =
        await renderComponent();
      expect(await findByText('Node')).toBeInTheDocument();
      changeSelect('Asset to Receive', 'test asset');
      fireEvent.change(getByLabelText('Amount'), { target: { value: '5000' } });
      fireEvent.click(getByText('Create Invoice'));

      expect(
        await findByText('Not enough assets in a channel to create the invoice'),
      ).toBeInTheDocument();
      expect(lightningServiceMock.createInvoice).not.toHaveBeenCalled();
    });
  });
});
