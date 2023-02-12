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
    const network = getNetwork(1, 'test network', status, 2);
    const { compatibility } = defaultRepoState.images.LND;
    const otherLND = createLndNetworkNode(
      network,
      network.nodes.lightning[0].version,
      compatibility,
      testNodeDocker,
    );
    network.nodes.lightning.push(otherLND);
    const oldLnd = createLndNetworkNode(
      network,
      '0.7.1-beta',
      compatibility,
      testNodeDocker,
      status,
    );
    network.nodes.lightning.push(oldLnd);
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
    const { getByText, changeSelect } = await renderComponent(Status.Started);
    changeSelect('Taro Node', 'bob-taro');
    expect(
      getByText('The bob-taro node will be restarted automatically to apply the change.'),
    ).toBeInTheDocument();
  });
  it('should render button', async () => {
    const { getByText } = await renderComponent();
    const btn = getByText('Change Backend');
    expect(btn).toBeInTheDocument();
    expect(btn.parentElement).toBeInstanceOf(HTMLButtonElement);
  });
  it('should hide modal when cancel is clicked', async () => {
    const { getByText, queryByText } = await renderComponent();
    const btn = getByText('Cancel');
    expect(btn).toBeInTheDocument();
    expect(btn.parentElement).toBeInstanceOf(HTMLButtonElement);
    fireEvent.click(getByText('Cancel'));
    expect(queryByText('Cancel')).not.toBeInTheDocument();
  });
  it('should display the compatibility warning for older bitcoin node', async () => {
    const { getByText, queryByText, changeSelect } = await renderComponent();
    const warning =
      `alice-taro is running tarod v2022.12.28-master which is compatible with LND v2022.12.28-master and newer.` +
      ` dave is running LND v0.7.1-beta so it cannot be used.`;
    expect(queryByText(warning)).not.toBeInTheDocument();
    expect(getByText('Cancel')).toBeInTheDocument();
    changeSelect('LND Node', 'dave');
    expect(getByText(warning)).toBeInTheDocument();
    changeSelect('LND Node', 'alice');
    expect(queryByText(warning)).not.toBeInTheDocument();
  });

  describe('with form submitted', () => {
    it('should update the backend successfully', async () => {
      const { getByText, changeSelect, store } = await renderComponent();
      changeSelect('LND Node', 'bob');
      fireEvent.click(getByText('Change Backend'));
      await waitFor(() => {
        expect(store.getState().modals.changeTaroBackend.visible).toBe(false);
      });
      expect(getByText('The alice-taro node will use bob')).toBeInTheDocument();
    });
    it('should succeed if a previous link does not exist', async () => {
      const { getByText, changeSelect, store } = await renderComponent();
      store.getActions().designer.removeLink('alice-taro-alice');
      changeSelect('LND Node', 'bob');
      fireEvent.click(getByText('Change Backend'));
      await waitFor(() => {
        expect(store.getState().modals.changeTaroBackend.visible).toBe(false);
      });
      expect(getByText('The alice-taro node will use bob')).toBeInTheDocument();
    });
    it('should restart containers when backend is updated', async () => {
      const { getByText, changeSelect } = await renderComponent(Status.Started);
      changeSelect('LND Node', 'bob');
      fireEvent.click(getByText('Change Backend'));
      await waitFor(() => {
        expect(injections.dockerService.stopNode).toBeCalledTimes(1);
        expect(injections.dockerService.startNode).toBeCalledTimes(1);
      });
    });
    it('should error if the backend is not changed', async () => {
      const { getByText, changeSelect } = await renderComponent();
      changeSelect('LND Node', 'alice');
      fireEvent.click(getByText('Change Backend'));
      await waitFor(() => {
        expect(
          getByText("The node 'alice-taro' is already connected to 'alice'"),
        ).toBeInTheDocument();
      });
    });
    it('should do nothing if an invalid node is selected', async () => {
      const { getByText } = await renderComponent(Status.Stopped, 'invalid');
      fireEvent.click(getByText('Change Backend'));
      await waitFor(() => {
        expect(getByText('Change Backend')).toBeInTheDocument();
      });
    });
  });
});
