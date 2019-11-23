import React from 'react';
import { fireEvent, wait, waitForElementToBeRemoved } from '@testing-library/dom';
import { Status } from 'shared/types';
import { BitcoindLibrary, LndLibrary } from 'types';
import { initChartFromNetwork } from 'utils/chart';
import {
  getNetwork,
  injections,
  lightningServiceMock,
  renderWithProviders,
} from 'utils/tests';
import OpenChannelModal from './OpenChannelModal';

const lndServiceMock = injections.lndService as jest.Mocked<LndLibrary>;
const bitcoindServiceMock = injections.bitcoindService as jest.Mocked<BitcoindLibrary>;

describe('OpenChannelModal', () => {
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
        openChannel: {
          visible: true,
          from: 'alice',
        },
      },
    };
    const cmp = <OpenChannelModal network={network} />;
    const result = renderWithProviders(cmp, { initialState });
    // wait for the loader to go away
    await waitForElementToBeRemoved(() => result.getByLabelText('icon: loading'));
    return {
      ...result,
      network,
    };
  };

  it('should render labels', async () => {
    const { getByText } = await renderComponent();
    expect(getByText('Source')).toBeInTheDocument();
    expect(getByText('Destination')).toBeInTheDocument();
    expect(getByText('Capacity (sats)')).toBeInTheDocument();
  });

  it('should render form inputs', async () => {
    const { getByLabelText } = await renderComponent();
    expect(getByLabelText('Source')).toBeInTheDocument();
    expect(getByLabelText('Destination')).toBeInTheDocument();
    expect(getByLabelText('Capacity (sats)')).toBeInTheDocument();
  });

  it('should render button', async () => {
    const { getByText } = await renderComponent();
    const btn = getByText('Open Channel');
    expect(btn).toBeInTheDocument();
    expect(btn.parentElement).toBeInstanceOf(HTMLButtonElement);
  });

  it('should hide modal when cancel is clicked', async () => {
    jest.useFakeTimers();
    const { getByText, queryByText } = await renderComponent();
    const btn = getByText('Cancel');
    expect(btn).toBeInTheDocument();
    expect(btn.parentElement).toBeInstanceOf(HTMLButtonElement);
    await wait(() => fireEvent.click(getByText('Cancel')));
    jest.runAllTimers();
    expect(queryByText('Cancel')).not.toBeInTheDocument();
    jest.useRealTimers();
  });

  it('should remove chart link when cancel is clicked', async () => {
    const { getByText, store } = await renderComponent(Status.Started);
    const linkId = 'xxxx';
    await wait(() => {
      const { designer } = store.getActions();
      const link = { linkId, fromNodeId: 'alice', fromPortId: 'p1' } as any;
      // create a new link which will open the modal
      designer.onLinkStart(link);
      designer.onLinkComplete({ ...link, toNodeId: 'bob', toPortId: 'p2' } as any);
    });
    expect(store.getState().designer.activeChart.links[linkId]).toBeTruthy();
    await wait(() => fireEvent.click(getByText('Cancel')));
    expect(store.getState().designer.activeChart.links[linkId]).toBeUndefined();
  });

  it('should display an error if unable to fetch node balances', async () => {
    lndServiceMock.getBalances.mockRejectedValue(new Error('error-msg'));
    const { getByText } = await renderComponent();
    expect(getByText('Unable to fetch node balances')).toBeInTheDocument();
    expect(getByText('error-msg')).toBeInTheDocument();
  });

  it('should display an error if form is not valid', async () => {
    const { getAllByText, getByText, store } = await renderComponent();
    await wait(() => store.getActions().modals.showOpenChannel({}));
    await wait(() => fireEvent.click(getByText('Open Channel')));
    expect(getAllByText('required')).toHaveLength(2);
  });

  it('should do nothing if an invalid node is selected', async () => {
    const { getByText, getByLabelText, store } = await renderComponent();
    const btn = getByText('Open Channel');
    await wait(() => {
      store.getActions().modals.showOpenChannel({ from: 'invalid', to: 'invalid' });
    });
    fireEvent.change(getByLabelText('Capacity (sats)'), { target: { value: '1000' } });
    await wait(() => fireEvent.click(btn));
    expect(btn).toBeInTheDocument();
  });

  describe('with form submitted', () => {
    beforeEach(() => {
      lightningServiceMock.getChannels.mockResolvedValue([]);
      lndServiceMock.getNewAddress.mockResolvedValue({ address: 'bc1aaaa' });
      lndServiceMock.getBalances.mockResolvedValue({
        confirmed: '100',
        unconfirmed: '200',
        total: '300',
      });
      bitcoindServiceMock.sendFunds.mockResolvedValue('txid');
    });

    it('should open a channel successfully', async () => {
      const { getByText, getByLabelText, store, network } = await renderComponent();
      await wait(() => {
        store.getActions().modals.showOpenChannel({ from: 'bob', to: 'alice' });
      });
      fireEvent.change(getByLabelText('Capacity (sats)'), { target: { value: '1000' } });
      fireEvent.click(getByLabelText('Deposit enough funds to bob to open the channel'));
      fireEvent.click(getByText('Open Channel'));
      await wait(() => {
        expect(store.getState().modals.openChannel.visible).toBe(false);
      });
      const [node1, node2] = network.nodes.lightning;
      expect(lndServiceMock.openChannel).toBeCalledWith(node2, node1, 1000);
      expect(bitcoindServiceMock.mine).toBeCalledTimes(1);
    });

    it('should open a channel and deposit funds', async () => {
      const { getByText, getByLabelText, store, network } = await renderComponent();
      await wait(() => {
        store.getActions().modals.showOpenChannel({ from: 'bob', to: 'alice' });
      });
      fireEvent.change(getByLabelText('Capacity (sats)'), { target: { value: '1000' } });
      fireEvent.click(getByText('Open Channel'));
      await wait(() => {
        expect(store.getState().modals.openChannel.visible).toBe(false);
      });
      const [node1, node2] = network.nodes.lightning;
      expect(lndServiceMock.openChannel).toBeCalledWith(node2, node1, 1000);
      expect(bitcoindServiceMock.mine).toBeCalledTimes(1);
      expect(bitcoindServiceMock.sendFunds).toBeCalledTimes(1);
      expect(lndServiceMock.getNewAddress).toBeCalledTimes(1);
    });

    it('should display an error when opening a channel fails', async () => {
      lndServiceMock.openChannel.mockRejectedValue(new Error('error-msg'));
      const { getByText, getByLabelText, store } = await renderComponent();
      await wait(() => {
        store.getActions().modals.showOpenChannel({ from: 'bob', to: 'alice' });
      });
      fireEvent.change(getByLabelText('Capacity (sats)'), { target: { value: '1000' } });
      fireEvent.click(getByLabelText('Deposit enough funds to bob to open the channel'));
      await wait(() => fireEvent.click(getByText('Open Channel')));
      expect(getByText('Unable to open the channel')).toBeInTheDocument();
      expect(getByText('error-msg')).toBeInTheDocument();
    });
  });
});
