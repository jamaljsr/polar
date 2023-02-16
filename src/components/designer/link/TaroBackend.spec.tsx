import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react';
import { LndNode, Status } from 'shared/types';
import { initChartFromNetwork } from 'utils/chart';
import {
  defaultTaroAsset,
  getNetwork,
  renderWithProviders,
  taroServiceMock,
} from 'utils/tests';
import TaroBackend from './TaroBackend';

describe('Taro Lnd Link Component', () => {
  const renderComponent = () => {
    const network = getNetwork(1, 'test network', Status.Stopped, 1);
    const allCharts = {
      1: initChartFromNetwork(network),
    };
    const from = network.nodes.taro[0];
    const to = network.nodes.lightning[0] as LndNode;

    const initialState = {
      network: {
        networks: [network],
      },
      designer: {
        activeId: network.id,
        allCharts,
      },
    };
    const cmp = <TaroBackend from={from} to={to} />;
    const result = renderWithProviders(cmp, {
      initialState,
    });
    return {
      ...result,
      from,
      to,
      network,
    };
  };
  it('should display Peer Names', () => {
    const { getByText, from, to } = renderComponent();
    expect(getByText(from.name)).toBeInTheDocument();
    expect(getByText(to.name)).toBeInTheDocument();
  });
  it('should display Peer Implementations', () => {
    const { getAllByText, from } = renderComponent();
    expect(getAllByText(from.implementation)).toHaveLength(1);
  });
  it('should display Peer Versions', () => {
    //Currently Taro and Lnd are the same version
    const { getAllByText, from } = renderComponent();
    expect(getAllByText(`v${from.version}`)).toHaveLength(2);
  });
  it('should not display the ChangeTaroBackend modal', async () => {
    const { getByText, store } = renderComponent();
    expect(store.getState().modals.changeTaroBackend.visible).toBe(false);
    fireEvent.click(getByText('Change Backend'));
    await waitFor(() => {
      expect(store.getState().modals.changeTaroBackend.visible).toBe(false);
    });
  });
  it('should display the ChangeTaroBackend modal', async () => {
    const { getByText, store, network } = renderComponent();
    taroServiceMock.listAssets.mockResolvedValue([defaultTaroAsset({})]);
    store.getActions().taro.getAssets(network.nodes.taro[0]);
    store.getActions().network.setStatus({ id: network.id, status: Status.Started });
    network.nodes.taro.forEach(n => (n.status = Status.Started));
    expect(store.getState().modals.changeTaroBackend.visible).toBe(false);
    fireEvent.click(getByText('Change Backend'));
    await waitFor(() => {
      expect(store.getState().modals.changeTaroBackend.visible).toBe(true);
    });
  });
  it('should not display the ChangeTaroBackend modal', async () => {
    const { getByText, store, network } = renderComponent();
    taroServiceMock.listAssets.mockResolvedValue([defaultTaroAsset({})]);
    await waitFor(() => {
      store.getActions().taro.getAssets(network.nodes.taro[0]);
      store.getActions().network.setStatus({ id: network.id, status: Status.Started });
    });

    expect(store.getState().modals.changeTaroBackend.visible).toBe(false);
    fireEvent.click(getByText('Change Backend'));
    await waitFor(() => {
      expect(store.getState().modals.changeTaroBackend.visible).toBe(false);
    });
  });
  // it('should not display the ChangeTaroBackend modal with stopped node', async () => {
  //   const { getByText, store, network } = renderComponent();
  //   await waitFor(() => {
  //     store.getActions().network.setStatus({ id: network.id, status: Status.Started });
  //   });
  //   //await dockerService.stopNode(network, network.nodes.taro[0]);
  //   expect(store.getState().modals.changeTaroBackend.visible).toBe(false);
  //   network.nodes.taro[0].status = Status.Stopped;
  //   fireEvent.click(getByText('Change Backend'));
  //   await waitFor(() => {
  //     expect(store.getState().modals.changeTaroBackend.visible).toBe(false);
  //   });
  // });
});
