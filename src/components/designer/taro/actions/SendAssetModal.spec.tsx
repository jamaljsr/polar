import React from 'react';
import { fireEvent } from '@testing-library/dom';
import { waitFor } from '@testing-library/react';
import { createStore } from 'easy-peasy';
import { Status } from 'shared/types';
import appModel from 'store/models/app';
import bitcoindModel from 'store/models/bitcoind';
import designerModel from 'store/models/designer';
import lightningModel from 'store/models/lightning';
import modalsModel from 'store/models/modals';
import networkModel from 'store/models/network';
import taroModel from 'store/models/taro';
import { initChartFromNetwork } from 'utils/chart';
import { defaultRepoState } from 'utils/constants';
import { createNetwork } from 'utils/network';
import {
  defaultTaroAddress,
  defaultTaroAsset,
  injections,
  lightningServiceMock,
  renderWithProviders,
  taroServiceMock,
  testManagedImages,
  testRepoState,
} from 'utils/tests';
import SendAssetModal from './SendAssetModal';

testManagedImages[0].version = testRepoState.images.LND.latest;

describe('SendAssetModal', () => {
  let unmount: () => void;

  const rootModel = {
    app: appModel,
    network: networkModel,
    lightning: lightningModel,
    bitcoind: bitcoindModel,
    designer: designerModel,
    taro: taroModel,
    modals: modalsModel,
  };
  // initialize store for type inference
  let store = createStore(rootModel, { injections });

  const network = createNetwork({
    id: 1,
    name: 'my-test',
    lndNodes: 0,
    clightningNodes: 0,
    eclairNodes: 0,
    bitcoindNodes: 1,
    status: Status.Started,
    repoState: defaultRepoState,
    managedImages: testManagedImages,
    customImages: [],
  });
  const cmp = <SendAssetModal network={network} />;

  const renderComponent = async () => {
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

    const result = renderWithProviders(cmp, { initialState, wrapForm: true });
    unmount = result.unmount;
    return {
      ...result,
      network,
      store,
    };
  };

  beforeEach(() => {
    store = createStore(rootModel, { injections });
    store.getState().network.networks.push(network);

    store.getActions().network.addNode({
      id: network.id,
      type: 'LND',
      version: testRepoState.images.LND.latest,
    });
    store.getActions().network.addNode({
      id: network.id,
      type: 'LND',
      version: testRepoState.images.LND.latest,
    });
    store.getActions().network.addNode({
      id: network.id,
      type: 'tarod',
      version: testRepoState.images.tarod.latest,
    });
    store.getActions().network.addNode({
      id: network.id,
      type: 'tarod',
      version: testRepoState.images.tarod.latest,
    });
    const chart = initChartFromNetwork(store.getState().network.networks[0]);
    store.getActions().designer.setChart({ id: network.id, chart });
    store.getActions().designer.setActiveId(network.id);
  });

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
      const { findByText, getByLabelText } = await renderComponent();
      taroServiceMock.decodeAddress.mockResolvedValue(
        defaultTaroAddress({ id: 'test1234', type: 'NORMAL', amount: '100' }),
      );

      expect(
        await findByText('Insufficient balance on lnd node alice'),
      ).toBeInTheDocument();
      expect(getByLabelText('Deposit enough funds to alice')).toBeInTheDocument();
    });
  });

  describe('successful decode', () => {
    it('should display assets information', async () => {
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
      taroServiceMock.decodeAddress.mockRejectedValue(new Error('bad'));
      const { getByText, getByLabelText } = await renderComponent();
      const input = getByLabelText('Taro Address');
      expect(input).toBeInTheDocument();
      fireEvent.change(input, { target: { value: 'asdfghdfsddasdf' } });
      await waitFor(() => {
        expect(taroServiceMock.decodeAddress).toHaveBeenCalled();
      });
      expect(getByText('ERROR: Invalid Address')).toBeInTheDocument();
    });
  });
});
