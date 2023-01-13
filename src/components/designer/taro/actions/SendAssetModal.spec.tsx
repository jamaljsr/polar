import React, { useMemo, useState } from 'react';
import { fireEvent, waitForElementToBeRemoved } from '@testing-library/dom';
import { waitFor } from '@testing-library/react';
import { Status } from 'shared/types';
import { BitcoindLibrary } from 'types';
import {
  injections,
  lightningServiceMock,
  taroServiceMock,
  renderWithProviders,
  getTaroNetwork,
  defaultTaroAsset,
  defaultTaroBalance,
} from 'utils/tests';

import { createNetwork, createTarodNetworkNode, getImageCommand } from 'utils/network';
import { testRepoState, testManagedImages } from 'utils/tests';

import SendAssetModal from './SendAssetModal';

testManagedImages[0].version = testRepoState.images.LND.latest;

describe('SendAssetModal', () => {
  let unmount: () => void;

  const renderComponent = async () => {
    const network = getTaroNetwork(1, 'test network');
    const bobTaro = createTarodNetworkNode(
      network,
      network.nodes.taro[0].version,
      network.nodes.taro[0].docker,
      Status.Started,
    );

    network.nodes.taro.push(bobTaro);

    const initialState = {
      network: {
        networks: [network],
      },
      taro: {
        nodes: {
          'alice-taro': {
            assets: [
              defaultTaroAsset({ name: 'TestUsd', type: 'NORMAL', amount: '10000' }),
              defaultTaroAsset({
                name: 'TestCollectible',
                type: 'COLLECTIBLE',
                amount: '1',
              }),
            ],
            balances: [],
          },
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
        sendAsset: {
          visible: true,
          nodeName: 'alice-taro',
        },
      },
    };
    const cmp = <SendAssetModal network={network} />;
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
    expect(getByText('Send an asset for alice-taro')).toBeInTheDocument();
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

  it('should warn when the recipient does not have the asset', async () => {
    const { getByText, getByLabelText } = await renderComponent();
    const input = getByLabelText('Recipient');
    expect(input).toBeInTheDocument();
    fireEvent.change(input, { target: { value: 'bob' } });
    await waitFor(() => {
      expect(getByText('Recipient does not have the asset')).toBeInTheDocument();
    });
  });
});
