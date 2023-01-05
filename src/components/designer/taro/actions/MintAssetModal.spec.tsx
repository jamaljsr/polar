import React from 'react';
import { act } from 'react-dom/test-utils';
import { fireEvent, waitForElementToBeRemoved } from '@testing-library/dom';
import { waitFor } from '@testing-library/react';
import { Status } from 'shared/types';
import { BitcoindLibrary } from 'types';
import { initChartFromNetwork } from 'utils/chart';
import { usePrefixedTranslation } from 'hooks';
import {
  defaultStateInfo,
  getNetwork,
  injections,
  lightningServiceMock,
  taroServiceMock,
  renderWithProviders,
  suppressConsoleErrors,
} from 'utils/tests';

import { createNetwork, createTarodNetworkNode, getImageCommand } from 'utils/network';
import { testRepoState, testManagedImages } from 'utils/tests';

import MintAssetModal from './MintAssetModal';
import { ExclamationCircleTwoTone } from '@ant-design/icons';

const bitcoindServiceMock = injections.bitcoindService as jest.Mocked<BitcoindLibrary>;

testManagedImages[0].version = testRepoState.images.LND.latest;

jest.setTimeout(80000);

describe('MintAssetModal', () => {
  let unmount: () => void;

  const renderComponent = async () => {
    const network = createNetwork({
      id: 1,
      name: 'test network',
      lndNodes: 2,
      clightningNodes: 0,
      eclairNodes: 0,
      bitcoindNodes: 1,
      status: Status.Started,
      repoState: testRepoState,
      managedImages: testManagedImages,
      customImages: [],
    });
    const dockerWrap = (command: string) => ({ image: '', command });
    const { latest, compatibility } = testRepoState.images.tarod;
    const cmd = getImageCommand(testManagedImages, 'tarod', latest);
    const taroAlice = createTarodNetworkNode(
      network,
      latest,
      { image: '', command: cmd },
      Status.Started,
    );
    network.nodes.taro = [taroAlice];

    const initialState = {
      network: {
        networks: [network],
      },
      taro: {
        nodes: {
          'alice-taro': {},
        },
      },
      lightning: {
        nodes: {
          alice: {
            walletBalance: {
              total: 500000,
              confirmed: 500000,
              unconfirmed: 0,
            },
          },
        },
      },
      designer: {
        activeId: 1,
        allCharts: {
          '1': {
            selected: {
              type: 'node',
              id: 'alice-taro',
            },
          },
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
    expect(getByText('Collectible')).toBeInTheDocument();
    expect(getByText('Amount')).toBeInTheDocument();
    expect(getByText('Asset Name')).toBeInTheDocument();
    expect(getByText('Meta Data')).toBeInTheDocument();
    expect(getByText('Enable Emission')).toBeInTheDocument();
    expect(getByText('Skip Batch')).toBeInTheDocument();
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
