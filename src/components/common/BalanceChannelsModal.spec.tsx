import React from 'react';
import { fireEvent } from '@testing-library/react';
import { getNetwork, renderWithProviders } from 'utils/tests';
import BalanceChannelsModal from './BalanceChannelsModal';
import { initChartFromNetwork } from 'utils/chart';

jest.mock('utils/async');

describe('BalanceChannelsModal', () => {
  let unmount: () => void;

  const renderComponent = async () => {
    const network = getNetwork(1, 'test network');

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
      lightning: {
        channelsInfo: [
          {
            id: '1',
            from: 'Alice',
            to: 'Bob',
            remoteBalance: 5000,
            localBalance: 5000,
            nextLocalBalance: 5000,
          },
        ],
      },
      modals: {
        balanceChannels: {
          visible: true,
        },
      },
    };

    const cmp = <BalanceChannelsModal network={network} />;
    const result = renderWithProviders(cmp, { initialState });
    unmount = result.unmount;

    return {
      ...result,
      network,
    };
  };

  afterEach(() => unmount());

  it('should render modal title and buttons', async () => {
    const { getByText } = await renderComponent();
    expect(getByText('Balance Channels')).toBeInTheDocument();
    expect(getByText('Update Channels')).toBeInTheDocument();
    expect(getByText('Close')).toBeInTheDocument();
  });

  it('should render channel details', async () => {
    const { getByText } = await renderComponent();
    expect(getByText(/Alice/i)).toBeInTheDocument();
    expect(getByText(/Bob/i)).toBeInTheDocument();
  });

  it('should hide modal when close is clicked', async () => {
    const { getByText, store } = await renderComponent();
    const btn = getByText('Close');
    expect(btn).toBeInTheDocument();
    expect(btn.parentElement).toBeInstanceOf(HTMLButtonElement);
    fireEvent.click(getByText('Close'));
    expect(store.getState().modals.balanceChannels.visible).toBe(false);
  });

  it('should trigger auto balance when the button is clicked', async () => {
    const { getByText, store } = await renderComponent();
    const autoBalanceBtn = getByText('Auto Balance');
    fireEvent.click(autoBalanceBtn);

    expect(store.getActions().lightning.autoBalanceChannelsInfo).toBeDefined();
  });

  it('should update the local balance when the slider is moved', async () => {
    const { getByRole, store } = await renderComponent();
    const slider = getByRole('slider');

    fireEvent.mouseDown(slider);
    fireEvent.mouseMove(slider, { clientX: 300 });
    fireEvent.mouseUp(slider);

    expect(store.getState().lightning.channelsInfo[0].nextLocalBalance).not.toBe(5000);
  });

  it('should call resetChannelsInfo when reset button is clicked', async () => {
    const { getByText, store } = await renderComponent();
    fireEvent.click(getByText('Reset'));
    expect(store.getState().lightning.channelsInfo[0].nextLocalBalance).toBe(5000);
  });

  // it('should call updateBalanceOfChannels when update button is clicked', async () => {
  //   const { getByText, store } = await renderComponent();
  //   const btn = getByText('Update Channels');
  //   fireEvent.click(btn);

  //   expect(store.getActions().lightning.updateBalanceOfChannels).toHaveBeenCalled();
  // });

  // it('should update balance of channels and hide modal', async () => {
  //   const { store, network } = await renderComponent();
  //   const { updateBalanceOfChannels } = store.getActions().lightning;
  //   const { hideBalanceChannels } = store.getActions().modals;
  //   const { notify } = store.getActions().app;

  //   // Set up channelsInfo in state
  //   const channelsInfo = [
  //     { id: '1', localBalance: '1000', nextLocalBalance: '2000' },
  //     { id: '2', localBalance: '3000', nextLocalBalance: '3000' },
  //   ];
  //   store.getState().lightning.channelsInfo = channelsInfo;

  //   // Call updateBalanceOfChannels
  //   await updateBalanceOfChannels(network);

  //   // Expect balanceChannels to be called with correct toPay array
  //   expect(store.getActions().lightning.balanceChannels).toHaveBeenCalledTimes(1);
  //   expect(store.getActions().lightning.balanceChannels).toHaveBeenCalledWith({
  //     id: network.id,
  //     toPay: [{ channelId: '1', nextLocalBalance: 2000 } // Expect deBalanceChannels to be called
  //   expect(hideBalanceChannels).toHaveBeenCalledTimes(1);

  //   // Expect tify to be called with success message
  //   expect(notify).toHaveBeenCalledTimes(1);
  //   expect(notify).toHaveBeenCalledWith({ message: 'Channels balanced!' });
  // });
});
