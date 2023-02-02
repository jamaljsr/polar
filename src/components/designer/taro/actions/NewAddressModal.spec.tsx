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
  injections,
  renderWithProviders,
  taroServiceMock,
  testManagedImages,
  testRepoState,
} from 'utils/tests';
import NewAddressModal from './NewAddressModal';

describe('NewAddressModal', () => {
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
        newAddress: {
          visible: true,
          nodeName: 'alice-taro',
        },
      },
    };
    const cmp = <NewAddressModal network={network} />;
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

  it('should render form inputs', async () => {
    const { getByLabelText, getByText } = await renderComponent();
    expect(
      getByLabelText('Generate new Taro address for alice-taro'),
    ).toBeInTheDocument();
    expect(getByLabelText('Amount')).toBeInTheDocument();
    expect(getByLabelText('Genesis Bootstrap Info')).toBeInTheDocument();
    expect(getByText('Choose a balance from Taro node')).toBeInTheDocument();
  });

  it('should render button', async () => {
    const { getByText } = await renderComponent();
    const btn = getByText('Generate');
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

  describe('with form submitted', () => {
    beforeEach(() => {
      // make each node's balance different
      taroServiceMock.newAddress.mockResolvedValue({
        encoded: 'taro1address',
        id: 'id',
        type: 'NORMAL',
        amount: '10',
        family: undefined,
        scriptKey: 'scriptKey',
        internalKey: 'internalKey',
        taprootOutputKey: 'taprootOutputKey',
      });
    });

    it('should generate address', async () => {
      const { getByText, getByLabelText, getByDisplayValue, findByText } =
        await renderComponent();
      const btn = getByText('Generate');
      expect(btn).toBeInTheDocument();
      expect(btn.parentElement).toBeInstanceOf(HTMLButtonElement);
      fireEvent.change(getByLabelText('Genesis Bootstrap Info'), {
        target: { value: 'taro1' },
      });
      fireEvent.change(getByLabelText('Amount'), { target: { value: '100' } });
      fireEvent.click(getByText('Generate'));
      expect(await findByText('Successfully created address')).toBeInTheDocument();
      expect(getByDisplayValue('taro1address')).toBeInTheDocument();
      const node = network.nodes.taro[0];
      expect(taroServiceMock.newAddress).toBeCalledWith(node, {
        genesisBootstrapInfo: Buffer.from('taro1', 'hex'),
        amt: 100,
      });
    });

    it('should close the modal', async () => {
      const { getByText, findByText, getByLabelText, store } = await renderComponent();
      fireEvent.change(getByLabelText('Genesis Bootstrap Info'), {
        target: { value: 'taro1' },
      });
      fireEvent.change(getByLabelText('Amount'), {
        target: { value: '1000' },
      });
      fireEvent.click(getByText('Generate'));
      fireEvent.click(await findByText('Copy & Close'));
      expect(store.getState().modals.newAddress.visible).toBe(false);
      expect(getByText('Copied taro1address to the clipboard')).toBeInTheDocument();
    });

    it('should display an error when creating the taro address fails', async () => {
      taroServiceMock.newAddress.mockRejectedValue(new Error('error-msg'));
      const { getByText, findByText, getByLabelText } = await renderComponent();
      fireEvent.change(getByLabelText('Genesis Bootstrap Info'), {
        target: { value: 'taro1' },
      });
      fireEvent.change(getByLabelText('Amount'), {
        target: { value: '1000' },
      });
      // await waitFor(() => );
      fireEvent.click(getByText('Generate'));
      expect(await findByText('error-msg')).toBeInTheDocument();
    });
  });
});
