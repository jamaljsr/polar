import React from 'react';
import { act } from 'react-dom/test-utils';
import { fireEvent, waitForElementToBeRemoved } from '@testing-library/dom';
import { waitFor } from '@testing-library/react';
import { Status } from 'shared/types';
import { LightningNodeChannelAsset } from 'lib/lightning/types';
import { BitcoindLibrary, Network } from 'types';
import { initChartFromNetwork } from 'utils/chart';
import { defaultRepoState } from 'utils/constants';
import { createNetwork, mapToTapd } from 'utils/network';
import {
  defaultStateChannel,
  defaultStateInfo,
  defaultTapBalance,
  getNetwork,
  injections,
  lightningServiceMock,
  renderWithProviders,
  suppressConsoleErrors,
  tapServiceMock,
  testManagedImages,
} from 'utils/tests';
import OpenChannelModal from './OpenChannelModal';

const bitcoindServiceMock = injections.bitcoindService as jest.Mocked<BitcoindLibrary>;

describe('OpenChannelModal', () => {
  let unmount: () => void;
  let network: Network;

  beforeEach(() => {
    network = getNetwork(1, 'test network', Status.Started);
  });

  const renderComponent = async (from = 'alice', to?: string) => {
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
        openChannel: {
          visible: true,
          from,
          to,
        },
      },
    };
    const cmp = <OpenChannelModal network={network} />;
    const result = renderWithProviders(cmp, { initialState });
    unmount = result.unmount;
    // wait for the loader to go away
    await waitForElementToBeRemoved(() => result.getByLabelText('loading'));
    return {
      ...result,
    };
  };

  afterEach(() => unmount());

  it('should render labels', async () => {
    const { getByText } = await renderComponent();
    expect(getByText('Source')).toBeInTheDocument();
    expect(getByText('Destination')).toBeInTheDocument();
    expect(getByText('Capacity')).toBeInTheDocument();
  });

  it('should render form inputs', async () => {
    const { getByLabelText } = await renderComponent();
    expect(getByLabelText('Source')).toBeInTheDocument();
    expect(getByLabelText('Destination')).toBeInTheDocument();
    expect(getByLabelText('Capacity')).toBeInTheDocument();
  });

  it('should render button', async () => {
    const { getByText } = await renderComponent();
    const btn = getByText('Open Channel');
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

  it('should remove chart link when cancel is clicked', async () => {
    const { getByText, store } = await renderComponent();
    const linkId = 'xxxx';
    const { designer } = store.getActions();
    const link = { linkId, fromNodeId: 'alice', fromPortId: 'p1' } as any;
    // create a new link which will open the modal
    act(() => {
      designer.onLinkStart(link);
    });
    act(() => {
      designer.onLinkComplete({ ...link, toNodeId: 'bob', toPortId: 'p2' } as any);
    });
    expect(store.getState().designer.activeChart.links[linkId]).toBeTruthy();
    fireEvent.click(getByText('Cancel'));
    await waitFor(() => {
      expect(store.getState().designer.activeChart.links[linkId]).toBeUndefined();
    });
  });

  it('should display an error if unable to fetch node balances', async () => {
    lightningServiceMock.getBalances.mockRejectedValue(new Error('error-msg'));
    const { getByText } = await renderComponent();
    expect(getByText('Unable to fetch node balances')).toBeInTheDocument();
    expect(getByText('error-msg')).toBeInTheDocument();
  });

  it('should display an error if form is not valid', async () => {
    await suppressConsoleErrors(async () => {
      const { findByText, getByText } = await renderComponent();
      fireEvent.click(getByText('Open Channel'));
      expect(await findByText('required')).toBeInTheDocument();
    });
  });

  it('should do nothing if an invalid node is selected', async () => {
    const { getByText, getByLabelText } = await renderComponent('invalid', 'invalid2');
    fireEvent.change(getByLabelText('Capacity'), { target: { value: '1000' } });
    fireEvent.click(getByText('Open Channel'));
    await waitFor(() => {
      expect(getByText('Open Channel')).toBeInTheDocument();
    });
  });

  describe('balances', () => {
    const balances = (confirmed: string) => ({
      confirmed,
      unconfirmed: '200',
      total: '300',
    });

    beforeEach(() => {
      // make each node's balance different
      lightningServiceMock.getBalances.mockImplementation(node =>
        Promise.resolve(balances((node.id + 100).toString())),
      );
    });

    it('should display the correct balance for the source', async () => {
      const { findByText, changeSelect } = await renderComponent();
      changeSelect('Source', 'bob');
      expect(await findByText('Balance: 101 sats')).toBeInTheDocument();
    });

    it('should display the correct balance for the destination', async () => {
      const { findByText, changeSelect } = await renderComponent();
      changeSelect('Destination', 'carol');
      expect(await findByText('Balance: 102 sats')).toBeInTheDocument();
    });

    it('should not display an empty balance', async () => {
      lightningServiceMock.getBalances.mockResolvedValue(balances(false as any));
      const { findByText } = await renderComponent();
      expect(await findByText('Balance: 0 sats')).toBeInTheDocument();
    });

    it('should not display invalid balance', async () => {
      lightningServiceMock.getBalances.mockResolvedValue(balances('invalid'));
      const { findByText } = await renderComponent();
      expect(await findByText('Balance: 0 sats')).toBeInTheDocument();
    });

    it('should display the deposit funds checkbox with low sats balance', async () => {
      lightningServiceMock.getBalances.mockResolvedValue(balances('0'));
      const { findByText } = await renderComponent();
      expect(
        await findByText('Deposit enough funds to alice to open the channel'),
      ).toBeInTheDocument();
    });
  });

  describe('with form submitted', () => {
    beforeEach(() => {
      lightningServiceMock.getInfo.mockResolvedValue(
        defaultStateInfo({ rpcUrl: 'asdf@host' }),
      );
      lightningServiceMock.getChannels.mockResolvedValue([]);
      lightningServiceMock.getNewAddress.mockResolvedValue({ address: 'bc1aaaa' });
      lightningServiceMock.getBalances.mockResolvedValue({
        confirmed: '100',
        unconfirmed: '200',
        total: '300',
      });
      bitcoindServiceMock.sendFunds.mockResolvedValue('txid');
    });

    it('should open a channel successfully', async () => {
      const { getByText, getByLabelText, store } = await renderComponent('bob', 'alice');
      fireEvent.change(getByLabelText('Capacity'), { target: { value: '1000' } });
      fireEvent.click(getByLabelText('Deposit enough funds to bob to open the channel'));
      fireEvent.click(getByText('Open Channel'));
      await waitFor(() => {
        expect(store.getState().modals.openChannel.visible).toBe(false);
      });
      const node2 = network.nodes.lightning[1];
      expect(lightningServiceMock.openChannel).toHaveBeenCalledWith({
        from: node2,
        toRpcUrl: 'asdf@host',
        amount: 1000,
        isPrivate: false,
      });
      expect(bitcoindServiceMock.mine).toHaveBeenCalledTimes(1);
    });

    it('should open a private channel successfully', async () => {
      const { getByText, getByLabelText, store } = await renderComponent('bob', 'alice');
      fireEvent.change(getByLabelText('Capacity'), { target: { value: '1000' } });
      fireEvent.click(getByLabelText('Deposit enough funds to bob to open the channel'));
      fireEvent.click(getByText('Make the channel private'));
      fireEvent.click(getByText('Open Channel'));
      await waitFor(() => {
        expect(store.getState().modals.openChannel.visible).toBe(false);
      });
      const node2 = network.nodes.lightning[1];
      expect(lightningServiceMock.openChannel).toHaveBeenCalledWith({
        from: node2,
        toRpcUrl: 'asdf@host',
        amount: 1000,
        isPrivate: true,
      });
      expect(bitcoindServiceMock.mine).toHaveBeenCalledTimes(1);
    });

    it('should open a channel and deposit funds', async () => {
      const { getByText, getByLabelText, store } = await renderComponent('bob', 'alice');
      fireEvent.change(getByLabelText('Capacity'), { target: { value: '1000' } });
      fireEvent.click(getByText('Open Channel'));
      await waitFor(() => {
        expect(store.getState().modals.openChannel.visible).toBe(false);
      });
      const node2 = network.nodes.lightning[1];
      expect(lightningServiceMock.openChannel).toHaveBeenCalledWith({
        from: node2,
        toRpcUrl: 'asdf@host',
        amount: 1000,
        isPrivate: false,
      });
      expect(bitcoindServiceMock.mine).toHaveBeenCalledTimes(2);
      expect(bitcoindServiceMock.sendFunds).toHaveBeenCalledTimes(1);
      expect(lightningServiceMock.getNewAddress).toHaveBeenCalledTimes(1);
    });

    it('should display an error when opening a channel fails', async () => {
      lightningServiceMock.openChannel.mockRejectedValue(new Error('error-msg'));
      const { getByText, getByLabelText, findByLabelText, changeSelect } =
        await renderComponent('bob');
      fireEvent.change(getByLabelText('Capacity'), { target: { value: '1000' } });
      changeSelect('Destination', 'alice');
      fireEvent.click(
        await findByLabelText('Deposit enough funds to bob to open the channel'),
      );
      fireEvent.click(getByText('Open Channel'));
      await waitFor(() => {
        expect(getByText('Unable to open the channel')).toBeInTheDocument();
      });
      expect(getByText('error-msg')).toBeInTheDocument();
    });
  });

  describe('with assets', () => {
    beforeEach(() => {
      network = createNetwork({
        id: 1,
        name: 'test network',
        lndNodes: 1,
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
      lightningServiceMock.getInfo.mockResolvedValue(
        defaultStateInfo({ pubkey: 'pub1', rpcUrl: 'asdf@host' }),
      );
      lightningServiceMock.getNewAddress.mockResolvedValue({ address: 'bc1aaaa' });
      lightningServiceMock.getBalances.mockResolvedValue({
        confirmed: '100',
        unconfirmed: '200',
        total: '300',
      });
      bitcoindServiceMock.sendFunds.mockResolvedValue('txid');
      lightningServiceMock.createInvoice.mockResolvedValue('lnbc1invoice');
      tapServiceMock.listBalances.mockResolvedValue([
        defaultTapBalance({ id: 'abcd', name: 'test asset', balance: '1000' }),
        defaultTapBalance({ id: 'efgh', name: 'other asset', balance: '5000' }),
      ]);
      tapServiceMock.addAssetBuyOrder.mockResolvedValue({
        scid: 'abcd',
        askPrice: '100',
      });
    });

    it('should display the asset dropdown', async () => {
      const { findByText } = await renderComponent('bob', 'carol');
      expect(await findByText('Asset')).toBeInTheDocument();
    });

    it('should display the asset dropdown when there are no assets', async () => {
      tapServiceMock.listBalances.mockResolvedValue(undefined as any);
      const { findByText } = await renderComponent('bob', 'carol');
      expect(await findByText('Asset')).toBeInTheDocument();
    });

    it('should not display the asset dropdown for non-litd node', async () => {
      const { findByText, queryByText } = await renderComponent('bob', 'alice');
      expect(await findByText('Source')).toBeInTheDocument();
      expect(queryByText('Asset')).not.toBeInTheDocument();
    });

    it('should not display the asset dropdown with no assets', async () => {
      tapServiceMock.listBalances.mockResolvedValue([]);
      const { findByText, queryByText } = await renderComponent('bob', 'alice');
      expect(await findByText('Source')).toBeInTheDocument();
      expect(queryByText('Asset')).not.toBeInTheDocument();
    });

    it('should fetch asset balances', async () => {
      const { findByText } = await renderComponent('bob', 'carol');
      expect(await findByText('Source')).toBeInTheDocument();
      expect(tapServiceMock.listBalances).toHaveBeenCalledTimes(3);
    });

    it('should update capacity when an asset is selected', async () => {
      const { findByText, getByLabelText, changeSelect } = await renderComponent(
        'bob',
        'carol',
      );
      expect(await findByText('Source')).toBeInTheDocument();
      expect(getByLabelText('Capacity')).toHaveValue('250,000');
      expect(await findByText('Asset')).toBeInTheDocument();
      // select the asset
      changeSelect('Asset', 'test asset');
      expect(getByLabelText('Capacity')).toHaveValue('1,000'); // half of the remote balance
      // select sats
      changeSelect('Asset', 'Bitcoin (sats)');
      expect(getByLabelText('Capacity')).toHaveValue('250,000');
    });

    it('should open an asset channel and deposit funds', async () => {
      const { getByText, getByLabelText, store, changeSelect } = await renderComponent(
        'bob',
        'carol',
      );
      changeSelect('Asset', 'test asset');
      fireEvent.change(getByLabelText('Capacity'), { target: { value: '1000' } });
      fireEvent.click(getByText('Open Channel'));
      await waitFor(() => {
        expect(store.getState().modals.openChannel.visible).toBe(false);
      });
      const node2 = network.nodes.lightning[1];
      expect(tapServiceMock.fundChannel).toHaveBeenCalledWith(
        mapToTapd(node2),
        'pub1',
        'abcd',
        1000,
      );
      expect(bitcoindServiceMock.mine).toHaveBeenCalledTimes(2);
      expect(bitcoindServiceMock.sendFunds).toHaveBeenCalledTimes(1);
      expect(lightningServiceMock.getNewAddress).toHaveBeenCalledTimes(1);
    });

    it('should open an asset channel without depositing funds', async () => {
      lightningServiceMock.getBalances.mockResolvedValue({
        confirmed: '1000000',
        unconfirmed: '0',
        total: '1000000',
      });
      const { getByText, getByLabelText, store, changeSelect } = await renderComponent(
        'bob',
        'carol',
      );
      changeSelect('Asset', 'test asset');
      fireEvent.change(getByLabelText('Capacity'), { target: { value: '1000' } });
      fireEvent.click(getByText('Open Channel'));
      await waitFor(() => {
        expect(store.getState().modals.openChannel.visible).toBe(false);
      });
      const node2 = network.nodes.lightning[1];
      expect(tapServiceMock.fundChannel).toHaveBeenCalledWith(
        mapToTapd(node2),
        'pub1',
        'abcd',
        1000,
      );
    });

    it('should display and error when opening an asset channel', async () => {
      lightningServiceMock.getBalances.mockResolvedValue({
        confirmed: '1000000',
        unconfirmed: '0',
        total: '1000000',
      });
      const { getByText, getByLabelText, findByText, changeSelect } =
        await renderComponent('bob', 'carol');

      changeSelect('Asset', 'test asset');
      fireEvent.change(getByLabelText('Capacity'), { target: { value: '5000' } });
      fireEvent.click(getByText('Open Channel'));

      expect(
        await findByText('Capacity cannot exceed the asset balance of 1000'),
      ).toBeInTheDocument();
      expect(tapServiceMock.fundChannel).not.toHaveBeenCalled();
    });
  });
});
