import React from 'react';
import { act } from 'react-dom/test-utils';
import { fireEvent, wait, waitForElementToBeRemoved } from '@testing-library/dom';
import { Status } from 'shared/types';
import { BitcoindLibrary } from 'types';
import { initChartFromNetwork } from 'utils/chart';
import {
  defaultStateInfo,
  getNetwork,
  injections,
  lightningServiceMock,
  renderWithProviders,
  suppressConsoleErrors,
} from 'utils/tests';
import OpenChannelModal from './OpenChannelModal';

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
    const { getByText, queryByText } = await renderComponent();
    const btn = getByText('Cancel');
    expect(btn).toBeInTheDocument();
    expect(btn.parentElement).toBeInstanceOf(HTMLButtonElement);
    fireEvent.click(getByText('Cancel'));
    await wait();
    expect(queryByText('Cancel')).not.toBeInTheDocument();
  });

  it('should remove chart link when cancel is clicked', async () => {
    const { getByText, store } = await renderComponent(Status.Started);
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
    await wait();
    expect(store.getState().designer.activeChart.links[linkId]).toBeUndefined();
  });

  it('should display an error if unable to fetch node balances', async () => {
    lightningServiceMock.getBalances.mockRejectedValue(new Error('error-msg'));
    const { getByText } = await renderComponent();
    expect(getByText('Unable to fetch node balances')).toBeInTheDocument();
    expect(getByText('error-msg')).toBeInTheDocument();
  });

  it('should display an error if form is not valid', async () => {
    await suppressConsoleErrors(async () => {
      const { getAllByText, getByText, store } = await renderComponent();
      act(() => store.getActions().modals.showOpenChannel({}));
      fireEvent.click(getByText('Open Channel'));
      expect(getAllByText('required')).toHaveLength(2);
    });
  });

  it('should do nothing if an invalid node is selected', async () => {
    const { getByText, getByLabelText, store } = await renderComponent();
    act(() =>
      store.getActions().modals.showOpenChannel({ from: 'invalid', to: 'invalid2' }),
    );
    fireEvent.change(getByLabelText('Capacity (sats)'), { target: { value: '1000' } });
    fireEvent.click(getByText('Open Channel'));
    await wait();
    expect(getByText('Open Channel')).toBeInTheDocument();
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
      const { getByText, getByLabelText, store, network } = await renderComponent();
      act(() => store.getActions().modals.showOpenChannel({ from: 'bob', to: 'alice' }));
      fireEvent.change(getByLabelText('Capacity (sats)'), { target: { value: '1000' } });
      fireEvent.click(getByLabelText('Deposit enough funds to bob to open the channel'));
      fireEvent.click(getByText('Open Channel'));
      await wait();
      expect(store.getState().modals.openChannel.visible).toBe(false);
      const node2 = network.nodes.lightning[1];
      expect(lightningServiceMock.openChannel).toBeCalledWith(node2, 'asdf@host', 1000);
      expect(bitcoindServiceMock.mine).toBeCalledTimes(1);
    });

    it('should open a channel and deposit funds', async () => {
      const { getByText, getByLabelText, store, network } = await renderComponent();
      act(() => store.getActions().modals.showOpenChannel({ from: 'bob', to: 'alice' }));
      fireEvent.change(getByLabelText('Capacity (sats)'), { target: { value: '1000' } });
      fireEvent.click(getByText('Open Channel'));
      await wait();
      expect(store.getState().modals.openChannel.visible).toBe(false);
      const node2 = network.nodes.lightning[1];
      expect(lightningServiceMock.openChannel).toBeCalledWith(node2, 'asdf@host', 1000);
      expect(bitcoindServiceMock.mine).toBeCalledTimes(2);
      expect(bitcoindServiceMock.sendFunds).toBeCalledTimes(1);
      expect(lightningServiceMock.getNewAddress).toBeCalledTimes(1);
    });

    it('should display an error when opening a channel fails', async () => {
      lightningServiceMock.openChannel.mockRejectedValue(new Error('error-msg'));
      const { getByText, getByLabelText, store } = await renderComponent();
      act(() => store.getActions().modals.showOpenChannel({ from: 'bob', to: 'alice' }));
      fireEvent.change(getByLabelText('Capacity (sats)'), { target: { value: '1000' } });
      fireEvent.click(getByLabelText('Deposit enough funds to bob to open the channel'));
      fireEvent.click(getByText('Open Channel'));
      await wait();
      expect(getByText('Unable to open the channel')).toBeInTheDocument();
      expect(getByText('error-msg')).toBeInTheDocument();
    });
  });
});
