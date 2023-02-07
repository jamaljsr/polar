import React from 'react';
import { fireEvent } from '@testing-library/dom';
import { waitFor } from '@testing-library/react';
import { Status, TaroNode } from 'shared/types';
import { BitcoindLibrary } from 'types';
import { initChartFromNetwork } from 'utils/chart';
import {
  defaultTaroAsset,
  getNetwork,
  injections,
  lightningServiceMock,
  renderWithProviders,
  taroServiceMock,
} from 'utils/tests';
import MintAssetModal from './MintAssetModal';

const bitcoindServiceMock = injections.bitcoindService as jest.Mocked<BitcoindLibrary>;

describe('MintAssetModal', () => {
  let unmount: () => void;
  let node: TaroNode;

  const renderComponent = async () => {
    const network = getNetwork(1, 'test network', Status.Started, 2);
    node = network.nodes.taro[0];

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
    };
  };

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
      taroServiceMock.listAssets.mockResolvedValue([
        defaultTaroAsset({
          name: 'LUSD',
          type: 'NORMAL',
          amount: '100',
        }),
      ]);
    });

    it('should mint normal asset', async () => {
      const { getByText, getByLabelText } = await renderComponent();
      fireEvent.change(getByLabelText('Amount'), { target: { value: '100' } });
      fireEvent.change(getByLabelText('Asset Name'), { target: { value: 'test' } });
      fireEvent.change(getByLabelText('Meta Data'), {
        target: { value: 'test' },
      });
      fireEvent.click(getByText('Mint'));
      await waitFor(() => {
        expect(taroServiceMock.mintAsset).toHaveBeenCalled();
        expect(bitcoindServiceMock.mine).toBeCalledTimes(1);
      });
    });

    it('should mint collectible asset', async () => {
      const { getByText, getByLabelText, changeSelect } = await renderComponent();
      changeSelect('Asset Type', 'Collectible');
      expect(getByLabelText('Amount')).toHaveAttribute('disabled');
      fireEvent.change(getByLabelText('Asset Name'), { target: { value: 'test' } });
      fireEvent.change(getByLabelText('Meta Data'), {
        target: { value: 'test' },
      });
      fireEvent.click(getByText('Mint'));
      await waitFor(() => {
        expect(taroServiceMock.mintAsset).toHaveBeenCalledWith(
          node,
          expect.objectContaining({ assetType: 'COLLECTIBLE' }),
        );
        expect(bitcoindServiceMock.mine).toBeCalledTimes(1);
      });
    });

    it('should display a warning when the LND balance is low', async () => {
      lightningServiceMock.getBalances.mockResolvedValue({
        confirmed: '0',
        unconfirmed: '0',
        total: '0',
      });
      const { findByText } = await renderComponent();
      expect(
        await findByText('Insufficient balance on lnd node alice'),
      ).toBeInTheDocument();
    });

    it('should deposit enough funds to mint', async () => {
      const { getByText, getByLabelText } = await renderComponent();
      fireEvent.change(getByLabelText('Amount'), { target: { value: '100' } });
      fireEvent.change(getByLabelText('Asset Name'), { target: { value: 'test' } });
      fireEvent.change(getByLabelText('Meta Data'), {
        target: { value: 'test' },
      });
      fireEvent.click(getByText('Deposit enough funds to alice'));
      fireEvent.click(getByText('Mint'));
      await waitFor(() => {
        expect(lightningServiceMock.getNewAddress).toBeCalled();
      });
    });

    it('should show an error for duplicate names', async () => {
      const { findByText, getByLabelText, store } = await renderComponent();
      await store.getActions().taro.getAssets(node);
      fireEvent.change(getByLabelText('Asset Name'), { target: { value: 'LUSD' } });
      expect(await findByText('Asset with this name already exists')).toBeInTheDocument();
    });

    it('should display an error when minting fails', async () => {
      taroServiceMock.mintAsset.mockRejectedValue(new Error('error-msg'));
      const { getByText, getByLabelText, findByText } = await renderComponent();
      const btn = getByText('Mint');
      expect(btn).toBeInTheDocument();
      expect(btn.parentElement).toBeInstanceOf(HTMLButtonElement);
      fireEvent.change(getByLabelText('Amount'), { target: { value: '100' } });
      fireEvent.change(getByLabelText('Asset Name'), { target: { value: 'test' } });
      fireEvent.change(getByLabelText('Meta Data'), {
        target: { value: 'test' },
      });
      fireEvent.click(getByText('Mint'));
      expect(await findByText('Failed to mint 100 test')).toBeInTheDocument();
      expect(await findByText('error-msg')).toBeInTheDocument();
    });
  });
});
