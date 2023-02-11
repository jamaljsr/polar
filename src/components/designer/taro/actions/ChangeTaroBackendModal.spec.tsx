import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react';
import { Status } from 'shared/types';
import { initChartFromNetwork } from 'utils/chart';
import { defaultRepoState } from 'utils/constants';
import { createLndNetworkNode } from 'utils/network';
import { getNetwork, injections, renderWithProviders, testNodeDocker } from 'utils/tests';
import ChangeTaroBackendModal from './ChangeTaroBackendModal';

describe('ChangeTaroBackendModal', () => {
  let unmount: () => void;
  const renderComponent = async (
    status?: Status,
    taroName = 'alice-taro',
    lndName = 'alice',
  ) => {
    const network = getNetwork(1, 'test network', status, 1);
    const { compatibility } = defaultRepoState.images.LND;
    const otherLND = createLndNetworkNode(
      network,
      network.nodes.lightning[0].version,
      compatibility,
      testNodeDocker,
    );
    network.nodes.lightning.push(otherLND);
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
        changeTaroBackend: {
          visible: true,
          taroName,
          lndName,
        },
      },
    };
    const cmp = <ChangeTaroBackendModal network={network} />;
    const result = renderWithProviders(cmp, { initialState });
    unmount = result.unmount;
    return { ...result, network };
  };
  afterEach(() => {
    unmount();
  });
  it('should render labels', async () => {
    const { getByText } = await renderComponent();
    expect(getByText('Change Taro Node Backend')).toBeInTheDocument();
    expect(getByText('Taro Node')).toBeInTheDocument();
    expect(getByText('LND Node')).toBeInTheDocument();
    expect(getByText('alice-taro')).toBeInTheDocument();
    expect(getByText('alice')).toBeInTheDocument();
  });
  it('should render the restart notice', async () => {
    const { getByText } = await renderComponent(Status.Started);
    expect(
      getByText('The alice node will be restarted automatically to apply the change.'),
    ).toBeInTheDocument();
  });
  it('should hide modal when cancel is clicked', async () => {
    const { getByText, queryByText } = await renderComponent();
    const btn = getByText('Cancel');
    expect(btn).toBeInTheDocument();
    expect(btn.parentElement).toBeInstanceOf(HTMLButtonElement);
    fireEvent.click(getByText('Cancel'));
    expect(queryByText('Cancel')).not.toBeInTheDocument();
  });

  describe('with form submitted', () => {
    it('should update the backend successfully', async () => {
      const { getByText, changeSelect, store } = await renderComponent();
      changeSelect('Bitcoin Node', 'backend2');
      fireEvent.click(getByText('Change Backend'));
      await waitFor(() => {
        expect(store.getState().modals.changeBackend.visible).toBe(false);
      });
      expect(
        getByText('The alice node will pull chain data from backend2'),
      ).toBeInTheDocument();
    });
    it('should succeed if a previous link does not exist', async () => {
      const { getByText, changeSelect, store } = await renderComponent();
      store.getActions().designer.removeLink('alice-backend1');
      changeSelect('Bitcoin Node', 'backend2');
      fireEvent.click(getByText('Change Backend'));
      await waitFor(() => {
        expect(store.getState().modals.changeBackend.visible).toBe(false);
      });
      expect(
        getByText('The alice node will pull chain data from backend2'),
      ).toBeInTheDocument();
    });
    it('should restart containers when backend is updated', async () => {
      const { getByText, changeSelect } = await renderComponent(Status.Started);
      changeSelect('Bitcoin Node', 'backend2');
      fireEvent.click(getByText('Change Backend'));
      await waitFor(() => {
        expect(injections.dockerService.stopNode).toBeCalledTimes(1);
        expect(injections.dockerService.startNode).toBeCalledTimes(1);
      });
    });
  });
});
