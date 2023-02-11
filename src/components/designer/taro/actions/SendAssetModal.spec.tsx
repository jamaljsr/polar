import React from 'react';
import { fireEvent } from '@testing-library/dom';
import { waitFor } from '@testing-library/react';
import { Status } from 'shared/types';
import { BitcoindLibrary } from 'types';
import { initChartFromNetwork } from 'utils/chart';
import {
  defaultTaroAddress,
  defaultTaroAsset,
  getNetwork,
  injections,
  lightningServiceMock,
  renderWithProviders,
  taroServiceMock,
} from 'utils/tests';
import SendAssetModal from './SendAssetModal';

const bitcoindServiceMock = injections.bitcoindService as jest.Mocked<BitcoindLibrary>;

describe('SendAssetModal', () => {
  let unmount: () => void;

  const renderComponent = async () => {
    const network = getNetwork(1, 'test network', Status.Started, 2);

    const initialState = {
      taro: {
        nodes: {
          'alice-taro': {
            assets: [
              defaultTaroAsset({ id: 'test1234', name: 'testAsset', amount: '1000' }),
            ],
            balances: [],
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
          nodeName: 'alice-taro',
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
      expect(getByLabelText('Send Asset from alice-taro')).toBeInTheDocument();
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
      taroServiceMock.decodeAddress.mockResolvedValue(
        defaultTaroAddress({ id: 'test1234', type: 'NORMAL', amount: '100' }),
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
      taroServiceMock.decodeAddress.mockResolvedValue(
        defaultTaroAddress({ id: 'test1234', type: 'NORMAL', amount: '100' }),
      );
      const { getByLabelText, getByText } = await renderComponent();
      await waitFor(() => {
        expect(lightningServiceMock.getBalances).toBeCalled();
      });
      const input = getByLabelText('Taro Address');
      expect(input).toBeInTheDocument();
      fireEvent.change(input, { target: { value: 'taro1address' } });
      await waitFor(() => {
        expect(taroServiceMock.decodeAddress).toBeCalled();
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
      taroServiceMock.decodeAddress.mockResolvedValue(
        defaultTaroAddress({ id: 'test1234', type: 'NORMAL', amount: '100' }),
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
      taroServiceMock.decodeAddress.mockResolvedValue(
        defaultTaroAddress({ id: 'test1234', type: 'NORMAL', amount: '100' }),
      );
      const { getByLabelText, getByText } = await renderComponent();
      const input = getByLabelText('Taro Address');
      expect(input).toBeInTheDocument();
      fireEvent.change(input, { target: { value: 'taro1address' } });
      fireEvent.click(getByText('Send'));
      await waitFor(() => {
        expect(taroServiceMock.decodeAddress).toHaveBeenCalled();
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
        expect(taroServiceMock.sendAsset).toHaveBeenCalled();
        expect(bitcoindServiceMock.mine).toHaveBeenCalled();
      });
    });
  });

  describe('When an address is successfully decoded', () => {
    it('should display assets information and have a successful send', async () => {
      taroServiceMock.decodeAddress.mockResolvedValue(
        defaultTaroAddress({ id: 'test1234', type: 'NORMAL', amount: '100' }),
      );
      const { getByText, getByLabelText } = await renderComponent();
      const input = getByLabelText('Taro Address');
      expect(input).toBeInTheDocument();
      fireEvent.change(input, { target: { value: 'asdfghdfsddasdf' } });
      await waitFor(() => {
        expect(taroServiceMock.decodeAddress).toHaveBeenCalled();
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
        expect(taroServiceMock.sendAsset).toHaveBeenCalled();
        expect(bitcoindServiceMock.mine).toHaveBeenCalled();
      });
    });

    it('should warn when asset is missing', async () => {
      taroServiceMock.decodeAddress.mockResolvedValue(
        defaultTaroAddress({ id: 'badid' }),
      );
      const { getByText, getByLabelText } = await renderComponent();
      const input = getByLabelText('Taro Address');
      expect(input).toBeInTheDocument();
      fireEvent.change(input, { target: { value: 'taro1address' } });
      await waitFor(() => {
        expect(taroServiceMock.decodeAddress).toHaveBeenCalled();
      });
      expect(getByText('alice-taro is missing this asset')).toBeInTheDocument();
      expect(getByText('Asset Id:')).toBeInTheDocument();
      expect(getByText('badid')).toBeInTheDocument();
    });
  });

  describe('An unsuccessful decode', () => {
    beforeEach(() => {
      taroServiceMock.decodeAddress.mockRejectedValue(new Error('Error message'));
    });
    it('should display error', async () => {
      const { getByText, getByLabelText } = await renderComponent();
      const input = getByLabelText('Taro Address');
      expect(input).toBeInTheDocument();
      fireEvent.change(input, { target: { value: 'taro1...' } });
      await waitFor(() => {
        expect(taroServiceMock.decodeAddress).toHaveBeenCalled();
      });
      expect(getByText('ERROR: Invalid Address')).toBeInTheDocument();
    });
    it('should clear the error when taro address field is reset', async () => {
      const { getByText, getByLabelText, queryByText } = await renderComponent();
      const input = getByLabelText('Taro Address');
      expect(input).toBeInTheDocument();
      fireEvent.change(input, { target: { value: 'taro1...' } });

      await waitFor(() => {
        expect(taroServiceMock.decodeAddress).toHaveBeenCalled();
      });
      expect(getByText('ERROR: Invalid Address')).toBeInTheDocument();
      fireEvent.change(input, { target: { value: '' } });
      expect(queryByText('ERROR: Invalid Address')).toBeNull();
    });
  });

  describe('When there is a send error', () => {
    it('should display an error', async () => {
      taroServiceMock.decodeAddress.mockResolvedValue(
        defaultTaroAddress({ id: 'test1234', type: 'NORMAL', amount: '100' }),
      );
      taroServiceMock.sendAsset.mockRejectedValue(new Error('Error message'));
      const { getByText, getByLabelText } = await renderComponent();
      const input = getByLabelText('Taro Address');
      expect(input).toBeInTheDocument();
      fireEvent.change(input, { target: { value: 'taro1aaa...' } });
      await waitFor(() => {
        expect(taroServiceMock.decodeAddress).toHaveBeenCalled();
      });
      fireEvent.click(getByText('Send'));
      await waitFor(() => {
        expect(taroServiceMock.sendAsset).toHaveBeenCalled();
      });
      expect(getByText('Error message')).toBeInTheDocument();
    });
  });
});
