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
import { BitcoindLibrary } from 'types';
import { initChartFromNetwork } from 'utils/chart';
import { defaultRepoState } from 'utils/constants';
import { createNetwork } from 'utils/network';
import {
  injections,
  lightningServiceMock,
  renderWithProviders,
  taroServiceMock,
  testManagedImages,
  testRepoState,
} from 'utils/tests';
import MintAssetModal from './MintAssetModal';

const bitcoindServiceMock = injections.bitcoindService as jest.Mocked<BitcoindLibrary>;

describe('MintAssetModal', () => {
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

  const renderComponent = async () => {
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
        mintAsset: {
          visible: true,
          nodeName: 'alice-taro',
        },
      },
    };
    const cmp = <MintAssetModal network={network} />;
    const result = renderWithProviders(cmp, { initialState });
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
    //store.getState().modals.mintAsset = { visible: true, nodeName: 'alice-taro' };

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
    const { getByText } = await renderComponent();
    expect(getByText('Mint an asset for alice-taro')).toBeInTheDocument();
    expect(getByText('Asset Type')).toBeInTheDocument();
    expect(getByText('Amount')).toBeInTheDocument();
    expect(getByText('Asset Name')).toBeInTheDocument();
    expect(getByText('Meta Data')).toBeInTheDocument();
    expect(getByText('Support ongoing emission of this asset')).toBeInTheDocument();
    expect(getByText('Skip batch to mint asset immediately')).toBeInTheDocument();
  });

  it('should render form inputs', async () => {
    const { getByLabelText } = await renderComponent();
    expect(getByLabelText('Amount')).toBeInTheDocument();
    expect(getByLabelText('Asset Name')).toBeInTheDocument();
    expect(getByLabelText('Meta Data')).toBeInTheDocument();
  });

  it('should render button', async () => {
    const { getByText } = await renderComponent();
    const btn = getByText('Mint');
    expect(btn).toBeInTheDocument();
    expect(btn.parentElement).toBeInstanceOf(HTMLButtonElement);
  });

  it('should hide modal when cancel is clicked', async () => {
    const { getByText, queryByText, store } = await renderComponent();
    const btn = getByText('Cancel');
    expect(btn).toBeInTheDocument();
    expect(btn.parentElement).toBeInstanceOf(HTMLButtonElement);
    fireEvent.click(btn);
    await waitFor(() => {
      expect(store.getState().modals.mintAsset.visible).toBe(false);
      expect(queryByText('Cancel')).not.toBeInTheDocument();
    });
  });

  describe('mint asset', () => {
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
      taroServiceMock.mintAsset.mockResolvedValue({
        batchKey: Buffer.from('mocked success!'),
      });

      lightningServiceMock.getBalances.mockResolvedValue({
        confirmed: '10000',
        unconfirmed: '20000',
        total: '30000',
      });
    });

    it('should mint asset', async () => {
      const { getByText, getByLabelText, store } = await renderComponent();
      const btn = getByText('Mint');
      expect(btn).toBeInTheDocument();
      expect(btn.parentElement).toBeInstanceOf(HTMLButtonElement);
      fireEvent.change(getByLabelText('Amount'), { target: { value: '100' } });
      fireEvent.change(getByLabelText('Asset Name'), { target: { value: 'test' } });
      fireEvent.change(getByLabelText('Meta Data'), {
        target: { value: 'test' },
      });
      fireEvent.click(getByText('Mint'));
      await waitFor(() => {
        //expect(store.getState().modals.mintAsset.visible).toBe(false);
        expect(taroServiceMock.mintAsset).toHaveBeenCalled();
        expect(bitcoindServiceMock.mine).toBeCalledTimes(1);
      });
    });
  });
});
