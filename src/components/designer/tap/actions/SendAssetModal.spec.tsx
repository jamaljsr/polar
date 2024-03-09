import React from 'react';
import { fireEvent } from '@testing-library/dom';
import { waitFor } from '@testing-library/react';
import { Status } from 'shared/types';
import { BitcoindLibrary } from 'types';
import { initChartFromNetwork } from 'utils/chart';
import {
  defaultTapAddress,
  defaultTapAsset,
  defaultTapBalance,
  getNetwork,
  injections,
  lightningServiceMock,
  renderWithProviders,
  tapServiceMock,
} from 'utils/tests';
import SendAssetModal from './SendAssetModal';

const bitcoindServiceMock = injections.bitcoindService as jest.Mocked<BitcoindLibrary>;

describe('SendAssetModal', () => {
  let unmount: () => void;

  const renderComponent = async () => {
    const network = getNetwork(1, 'test network', Status.Started?.toString(), 2);

    const initialState = {
      tap: {
        nodes: {
          'alice-tap': {
            assets: [
              defaultTapAsset({ id: 'test1234', name: 'testAsset', amount: '1000' }),
            ],
            balances: [
              defaultTapBalance({ id: 'test1234', name: 'testAsset', balance: '1000' }),
            ],
          },
        },
      },
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
        sendAsset: {
          visible: true,
          nodeName: 'alice-tap',
        },
      },
    };
    const cmp = <SendAssetModal network={network} />;

    const result = renderWithProviders(cmp, { initialState, wrapForm: true });
    unmount = result.unmount;
    return {
      ...result,
      network,
    };
  };

  afterEach(() => unmount());

  describe('When the modal displays', () => {
    it('should render labels', async () => {
      const { getByLabelText } = await renderComponent();
      expect(getByLabelText('Send Asset from alice-tap')).toBeInTheDocument();
    });

    it('should hide when cancel is clicked', async () => {
      const { getByText, queryByText, store } = await renderComponent();
      const btn = getByText('Cancel');
      expect(btn).toBeInTheDocument();
      expect(btn.parentElement).toBeInstanceOf(HTMLButtonElement);
      fireEvent.click(btn);
      await waitFor(() => {
        expect(store.getState().modals.sendAsset.visible).toBe(false);
        expect(queryByText('Cancel')).not.toBeInTheDocument();
      });
    });
  });
  describe('When lnd balance is low', () => {
    beforeEach(() => {
      lightningServiceMock.getBalances.mockResolvedValue({
        confirmed: '100',
        unconfirmed: '200',
        total: '300',
      });
      tapServiceMock.decodeAddress.mockResolvedValue(
        defaultTapAddress({ id: 'test1234', type: 'NORMAL', amount: '100' }),
      );
    });
    it('should an alert should display', async () => {
      const { findByText } = await renderComponent();
      expect(
        await findByText('Insufficient balance on lnd node alice'),
      ).toBeInTheDocument();
    });
    it('should auto deposit should be present', async () => {
      const { findByText, getByText } = await renderComponent();
      expect(
        await findByText('Insufficient balance on lnd node alice'),
      ).toBeInTheDocument();
      expect(getByText('Deposit enough funds to alice')).toBeInTheDocument();
    });
    it('should disable the alert when auto deposit is enabled', async () => {
      const { queryByText, getByText } = await renderComponent();
      await waitFor(() => {
        expect(lightningServiceMock.getBalances).toBeCalled();
      });
      fireEvent.click(getByText('Deposit enough funds to alice'));
      expect(
        queryByText('Insufficient balance on lnd node alice'),
      ).not.toBeInTheDocument();
    });
    it('should call new address when send is clicked', async () => {
      tapServiceMock.decodeAddress.mockResolvedValue(
        defaultTapAddress({ id: 'test1234', type: 'NORMAL', amount: '100' }),
      );
      const { getByLabelText, getByText } = await renderComponent();
      await waitFor(() => {
        expect(lightningServiceMock.getBalances).toBeCalled();
      });
      const input = getByLabelText('TAP Address');
      expect(input).toBeInTheDocument();
      fireEvent.change(input, { target: { value: 'tap1address' } });
      await waitFor(() => {
        expect(tapServiceMock.decodeAddress).toBeCalled();
      });
      fireEvent.click(getByText('Deposit enough funds to alice'));

      expect(getByText('Address Info')).toBeInTheDocument();
      fireEvent.click(getByText('Send'));
      await waitFor(() => {
        expect(lightningServiceMock.getNewAddress).toHaveBeenCalled();
      });
    });
  });
  describe('When the lnd balance is high', () => {
    beforeEach(() => {
      lightningServiceMock.getBalances.mockResolvedValue({
        confirmed: '100000',
        unconfirmed: '200000',
        total: '300000',
      });
      tapServiceMock.decodeAddress.mockResolvedValue(
        defaultTapAddress({
          id: 'test1234',
          type: 'NORMAL',
          amount: '100',
          internalKey: 'key1234',
        }),
      );
    });

    it('should not display an alert or auto deposit', async () => {
      const { queryByText } = await renderComponent();
      expect(
        queryByText('Insufficient balance on lnd node alice'),
      ).not.toBeInTheDocument();
      expect(queryByText('Deposit enough funds to alice')).not.toBeInTheDocument();
    });

    it('should send the asset when send is clicked', async () => {
      tapServiceMock.decodeAddress.mockResolvedValue(
        defaultTapAddress({ id: 'test1234', type: 'NORMAL', amount: '100' }),
      );
      tapServiceMock.listBalances.mockResolvedValue([
        defaultTapBalance({ id: 'test1234', name: 'testAsset', balance: '1000' }),
      ]);
      const { getByLabelText, getByText, queryByText } = await renderComponent();
      const input = getByLabelText('TAP Address');
      expect(input).toBeInTheDocument();
      fireEvent.change(input, { target: { value: 'tap1address' } });
      fireEvent.click(getByText('Send'));
      await waitFor(() => {
        expect(tapServiceMock.decodeAddress).toHaveBeenCalled();
      });
      expect(getByText('Address Info')).toBeInTheDocument();
      expect(getByText('Name')).toBeInTheDocument();
      expect(getByText('testAsset')).toBeInTheDocument();
      expect(getByText('Type')).toBeInTheDocument();
      expect(getByText('NORMAL')).toBeInTheDocument();
      expect(getByText('Amount')).toBeInTheDocument();
      expect(getByText('100')).toBeInTheDocument();
      fireEvent.click(getByText('Send'));

      await waitFor(() => {
        expect(tapServiceMock.sendAsset).toHaveBeenCalled();
        expect(bitcoindServiceMock.mine).toHaveBeenCalled();
        expect(tapServiceMock.listBalances).toHaveBeenCalled();
      });

      // return an updated balance after the sendAsset request
      tapServiceMock.listBalances.mockResolvedValue([
        defaultTapBalance({ id: 'test1234', name: 'testAsset', balance: '1100' }),
      ]);

      // the modal should close after the senders balance changes
      await waitFor(() => {
        expect(queryByText('Send')).not.toBeInTheDocument();
        expect(getByText("Sent 100 testAsset's to tap1address")).toBeInTheDocument();
      });
    });
  });

  describe('When an address is successfully decoded', () => {
    it('should display assets information and have a successful send', async () => {
      tapServiceMock.decodeAddress.mockResolvedValue(
        defaultTapAddress({ id: 'test1234', type: 'NORMAL', amount: '100' }),
      );
      const { getByText, getByLabelText } = await renderComponent();
      const input = getByLabelText('TAP Address');
      expect(input).toBeInTheDocument();
      fireEvent.change(input, { target: { value: 'asdfghdfsddasdf' } });
      await waitFor(() => {
        expect(tapServiceMock.decodeAddress).toHaveBeenCalled();
      });
      expect(getByText('Address Info')).toBeInTheDocument();
      expect(getByText('Name')).toBeInTheDocument();
      expect(getByText('testAsset')).toBeInTheDocument();
      expect(getByText('Type')).toBeInTheDocument();
      expect(getByText('NORMAL')).toBeInTheDocument();
      expect(getByText('Amount')).toBeInTheDocument();
      expect(getByText('100')).toBeInTheDocument();
      //send asset
      fireEvent.click(getByText('Send'));
      await waitFor(() => {
        expect(tapServiceMock.sendAsset).toHaveBeenCalled();
        expect(bitcoindServiceMock.mine).toHaveBeenCalled();
      });
    });

    it('should warn when asset is missing', async () => {
      tapServiceMock.decodeAddress.mockResolvedValue(defaultTapAddress({ id: 'badid' }));
      const { getByText, getByLabelText } = await renderComponent();
      const input = getByLabelText('TAP Address');
      expect(input).toBeInTheDocument();
      fireEvent.change(input, { target: { value: 'tap1address' } });
      await waitFor(() => {
        expect(tapServiceMock.decodeAddress).toHaveBeenCalled();
      });
      expect(getByText('alice-tap is missing this asset')).toBeInTheDocument();
      expect(getByText('Asset Id:')).toBeInTheDocument();
      expect(getByText('badid')).toBeInTheDocument();
    });
  });

  describe('An unsuccessful decode', () => {
    beforeEach(() => {
      tapServiceMock.decodeAddress.mockRejectedValue(new Error('Error message'));
    });
    it('should display error', async () => {
      const { getByText, getByLabelText } = await renderComponent();
      const input = getByLabelText('TAP Address');
      expect(input).toBeInTheDocument();
      fireEvent.change(input, { target: { value: 'tap1...' } });
      await waitFor(() => {
        expect(tapServiceMock.decodeAddress).toHaveBeenCalled();
      });
      expect(getByText('ERROR: Invalid Address')).toBeInTheDocument();
    });
    it('should clear the error when tap address field is reset', async () => {
      const { getByText, getByLabelText, queryByText } = await renderComponent();
      const input = getByLabelText('TAP Address');
      expect(input).toBeInTheDocument();
      fireEvent.change(input, { target: { value: 'tap1...' } });

      await waitFor(() => {
        expect(tapServiceMock.decodeAddress).toHaveBeenCalled();
      });
      expect(getByText('ERROR: Invalid Address')).toBeInTheDocument();
      fireEvent.change(input, { target: { value: '' } });
      expect(queryByText('ERROR: Invalid Address')).toBeNull();
    });
  });

  describe('When there is a send error', () => {
    it('should display an error', async () => {
      tapServiceMock.decodeAddress.mockResolvedValue(
        defaultTapAddress({ id: 'test1234', type: 'NORMAL', amount: '100' }),
      );
      tapServiceMock.sendAsset.mockRejectedValue(new Error('Error message'));
      const { getByText, getByLabelText } = await renderComponent();
      const input = getByLabelText('TAP Address');
      expect(input).toBeInTheDocument();
      fireEvent.change(input, { target: { value: 'tap1aaa...' } });
      await waitFor(() => {
        expect(tapServiceMock.decodeAddress).toHaveBeenCalled();
      });
      fireEvent.click(getByText('Send'));
      await waitFor(() => {
        expect(tapServiceMock.sendAsset).toHaveBeenCalled();
      });
      expect(getByText('Error message')).toBeInTheDocument();
    });
  });
});
