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
            assets: [defaultTaroAsset({ id: 'test1234', name: 'testAsset' })],
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

  it('should render labels', async () => {
    const { getByLabelText } = await renderComponent();
    expect(getByLabelText('Send Asset from alice-taro')).toBeInTheDocument();
  });

  it('should hide modal when cancel is clicked', async () => {
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

  describe('taro lnd node low balance should display alert', () => {
    it('alert should be present', async () => {
      lightningServiceMock.getBalances.mockResolvedValue({
        confirmed: '100',
        unconfirmed: '200',
        total: '300',
      });
      const { findByText, getByLabelText, getByText } = await renderComponent();
      taroServiceMock.decodeAddress.mockResolvedValue(
        defaultTaroAddress({ id: 'test1234', type: 'NORMAL', amount: '100' }),
      );
      const input = getByLabelText('Taro Address');
      expect(input).toBeInTheDocument();
      fireEvent.change(input, { target: { value: 'asdfghdfsddasdf' } });
      expect(
        await findByText('Insufficient balance on lnd node alice'),
      ).toBeInTheDocument();
      expect(getByLabelText('Deposit enough funds to alice')).toBeInTheDocument();
      fireEvent.click(getByText('Deposit enough funds to alice'));
      fireEvent.click(getByText('Send'));
      await waitFor(() => {
        expect(lightningServiceMock.getNewAddress).toHaveBeenCalled();
      });
    });
  });

  describe('successful decode', () => {
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

    it('with missing asset should warn', async () => {
      taroServiceMock.decodeAddress.mockResolvedValue(
        defaultTaroAddress({ id: 'badid' }),
      );
      const { getByText, getByLabelText } = await renderComponent();
      const input = getByLabelText('Taro Address');
      expect(input).toBeInTheDocument();
      fireEvent.change(input, { target: { value: 'asdfghdfsddasdf' } });
      await waitFor(() => {
        expect(taroServiceMock.decodeAddress).toHaveBeenCalled();
      });
      expect(getByText('alice-taro is missing this asset')).toBeInTheDocument();
      expect(getByText('Asset Id:')).toBeInTheDocument();
      expect(getByText('badid')).toBeInTheDocument();
    });
  });

  describe('unsuccessful decode', () => {
    it('should display error', async () => {
      taroServiceMock.decodeAddress.mockRejectedValueOnce(new Error('bad'));
      const { getByText, getByLabelText } = await renderComponent();
      const input = getByLabelText('Taro Address');
      expect(input).toBeInTheDocument();
      fireEvent.change(input, { target: { value: 'taro1...' } });
      await waitFor(() => {
        expect(taroServiceMock.decodeAddress).toHaveBeenCalled();
      });
      expect(getByText('ERROR: Invalid Address')).toBeInTheDocument();
    });
  });

  describe('send error', () => {
    it('should display error', async () => {
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

  describe('clear error', () => {
    it('should clear help error', async () => {
      taroServiceMock.decodeAddress.mockRejectedValue(new Error('Error message'));
      lightningServiceMock.getBalances.mockResolvedValue({
        confirmed: '100',
        unconfirmed: '200',
        total: '300',
      });
      const { getByText, getByLabelText, queryByText } = await renderComponent();
      const input = getByLabelText('Taro Address');
      expect(input).toBeInTheDocument();
      fireEvent.change(input, { target: { value: 'taro1aaa...' } });

      await waitFor(() => {
        expect(taroServiceMock.decodeAddress).toHaveBeenCalled();
      });
      expect(getByText('ERROR: Invalid Address')).toBeInTheDocument();
      fireEvent.change(input, { target: { value: '' } });
      expect(queryByText('ERROR: Invalid Address')).toBeNull();
    });
  });
});
