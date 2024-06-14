import React from 'react';
import { act, fireEvent, waitFor } from '@testing-library/react';
import { Status } from 'shared/types';
import { initChartFromNetwork } from 'utils/chart';
import { defaultRepoState } from 'utils/constants';
import { createBitcoindNetworkNode, createLndNetworkNode } from 'utils/network';
import {
  getNetwork,
  injections,
  renderWithProviders,
  suppressConsoleErrors,
  testNodeDocker,
  testRepoState,
} from 'utils/tests';
import ChangeBackendModal from './ChangeBackendModal';

describe('ChangeBackendModal', () => {
  let unmount: () => void;

  const renderComponent = async (
    status?: Status,
    lnName = 'alice',
    backendName = 'backend1',
  ) => {
    const network = getNetwork(1, 'test network', status?.toString());
    const oldBitcoind = createBitcoindNetworkNode(
      network,
      '0.18.1',
      testNodeDocker,
      status,
    );
    network.nodes.bitcoin.push(oldBitcoind);
    const { compatibility } = defaultRepoState.images.LND;
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
        changeBackend: {
          visible: true,
          lnName,
          backendName,
        },
      },
    };
    const cmp = <ChangeBackendModal network={network} />;
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
    expect(getByText('Lightning Node')).toBeInTheDocument();
    expect(getByText('Bitcoin Node')).toBeInTheDocument();
  });

  it('should render form inputs', async () => {
    const { getByLabelText } = await renderComponent();
    expect(getByLabelText('Lightning Node')).toBeInTheDocument();
    expect(getByLabelText('Bitcoin Node')).toBeInTheDocument();
  });

  it('should render button', async () => {
    const { getByText } = await renderComponent();
    const btn = getByText('Change Backend');
    expect(btn).toBeInTheDocument();
    expect(btn.parentElement).toBeInstanceOf(HTMLButtonElement);
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

  it('should remove chart link when cancel is clicked', async () => {
    const { getByText, store } = await renderComponent();
    const { designer } = store.getActions();
    const linkId = 'xxxx';
    const link = { linkId, fromNodeId: 'alice', fromPortId: 'backend' } as any;
    // create a new link which will open the modal
    act(() => {
      designer.onLinkStart(link);
    });
    act(() => {
      designer.onLinkComplete({
        ...link,
        toNodeId: 'backend2',
        toPortId: 'backend',
      } as any);
    });
    expect(store.getState().designer.activeChart.links[linkId]).toBeTruthy();
    fireEvent.click(getByText('Cancel'));
    await waitFor(() => {
      expect(store.getState().designer.activeChart.links[linkId]).toBeUndefined();
    });
  });

  it('should display the compatibility warning for older bitcoin node', async () => {
    const { getByText, queryByText, changeSelect, store } = await renderComponent();
    store.getActions().app.setRepoState(testRepoState);
    const bitcoindVersion = defaultRepoState.images.bitcoind.latest;
    const warning =
      'erin is running LND v0.7.1-beta which is compatible with Bitcoin Core v0.18.1 and older.' +
      ` backend1 is running v${bitcoindVersion} so it cannot be used.`;
    expect(queryByText(warning)).not.toBeInTheDocument();
    expect(getByText('Cancel')).toBeInTheDocument();
    changeSelect('Lightning Node', 'erin');
    expect(getByText(warning)).toBeInTheDocument();
    changeSelect('Lightning Node', 'alice');
    expect(queryByText(warning)).not.toBeInTheDocument();
  });

  it('should not display the compatibility warning', async () => {
    const { queryByLabelText } = await renderComponent(Status.Stopped, 'bob');
    const warning = queryByLabelText('exclamation-circle');
    expect(warning).not.toBeInTheDocument();
  });

  it('should display an error if form is not valid', async () => {
    await suppressConsoleErrors(async () => {
      const { getByText, getAllByText } = await renderComponent(Status.Stopped, '', '');
      fireEvent.click(getByText('Change Backend'));
      await waitFor(() => {
        expect(getAllByText('required')).toHaveLength(2);
      });
    });
  });

  it('should do nothing if an invalid node is selected', async () => {
    const { getByText } = await renderComponent(Status.Stopped, 'invalid');
    fireEvent.click(getByText('Change Backend'));
    await waitFor(() => {
      expect(getByText('Change Backend')).toBeInTheDocument();
    });
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
