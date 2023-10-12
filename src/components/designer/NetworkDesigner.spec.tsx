import React from 'react';
import { IChart } from '@mrblenny/react-flow-chart';
import { fireEvent, waitFor, waitForElementToBeRemoved } from '@testing-library/dom';
import { act } from '@testing-library/react';
import { Status } from 'shared/types';
import { themeColors } from 'theme/colors';
import { initChartFromNetwork } from 'utils/chart';
import {
  getNetwork,
  renderWithProviders,
  suppressConsoleErrors,
  testRepoState,
} from 'utils/tests';
import NetworkDesigner from './NetworkDesigner';

describe('NetworkDesigner Component', () => {
  beforeAll(() => {
    // hard-code the values of offsetWidth & offsetHeight for div elements, otherwise
    // the FlowChart component will not render any nodes because they are not in view
    // see https://github.com/MrBlenny/react-flow-chart/blob/d47bcbd2c65d53295b12174ee74b25f54c497a36/src/components/Canvas/Canvas.wrapper.tsx#L122
    Object.defineProperties(window.HTMLDivElement.prototype, {
      offsetHeight: { get: () => 1000 },
      offsetWidth: { get: () => 1000 },
    });
  });

  const renderComponent = (charts?: Record<number, IChart>, theme = 'dark') => {
    const network = getNetwork(1, 'test network', Status.Stopped, 2);
    const allCharts = charts || {
      1: initChartFromNetwork(network),
    };
    const initialState = {
      app: {
        settings: {
          theme,
        },
      },
      network: {
        networks: [network],
      },
      designer: {
        activeId: network.id,
        allCharts,
      },
      lightning: {
        nodes: {
          alice: {},
        },
      },
      tap: {
        nodes: {
          'alice-tap': {},
        },
      },
    };
    const cmp = <NetworkDesigner network={network} updateStateDelay={10} />;
    return renderWithProviders(cmp, { initialState });
  };

  it('should render the designer component', async () => {
    const { findByText } = renderComponent();
    expect(await findByText('alice')).toBeInTheDocument();
    expect(await findByText('bob')).toBeInTheDocument();
    expect(await findByText('backend1')).toBeInTheDocument();
  });

  it('should render correct # of lightning nodes', async () => {
    const { findByText } = renderComponent();
    expect(await findByText('alice')).toBeInTheDocument();
    expect(await findByText('bob')).toBeInTheDocument();
  });

  it('should render correct # of bitcoind nodes', async () => {
    const { findByText } = renderComponent();
    expect(await findByText('backend1')).toBeInTheDocument();
  });

  it('should display the default message in the sidebar', async () => {
    const { findByText } = renderComponent();
    expect(await findByText('Network Designer')).toBeInTheDocument();
  });

  it('should update the redux state after a node is selected', async () => {
    const { getByText, findByText, store } = renderComponent();
    expect(store.getState().designer.activeChart.selected.id).toBeFalsy();
    act(() => {
      fireEvent.click(getByText('alice'));
    });
    expect(await findByText('Node Type')).toBeInTheDocument();
    expect(store.getState().designer.activeChart.selected.id).not.toBeUndefined();
  });

  it('should not set the active chart if it does not exist', async () => {
    const { getByLabelText, store } = renderComponent({});
    expect(store.getState().designer.activeChart).toBeUndefined();
    expect(getByLabelText('loading')).toBeInTheDocument();
  });

  it('should display node details in the sidebar when a node is selected', async () => {
    const { getByText, queryByText, findByText } = renderComponent();
    expect(await findByText('backend1')).toBeInTheDocument();
    expect(queryByText('Node Type')).not.toBeInTheDocument();
    // click the bitcoind node in the chart
    fireEvent.click(getByText('backend1'));
    // ensure text from the sidebar is visible
    expect(await findByText('Node Type')).toBeInTheDocument();
  });

  it('should update the redux state when zoom buttons are clicked', async () => {
    const { getByLabelText, store } = renderComponent();
    expect(store.getState().designer.activeChart.scale).toBe(1);
    fireEvent.click(getByLabelText('zoom-in'));
    expect(store.getState().designer.activeChart.scale).toBe(1.1);
    fireEvent.click(getByLabelText('fullscreen'));
    expect(store.getState().designer.activeChart.scale).toBe(1.0);
    await waitFor(() =>
      expect(getByLabelText('fullscreen').parentElement).toBeDisabled(),
    );
    fireEvent.click(getByLabelText('zoom-out'));
    expect(store.getState().designer.activeChart.scale).toBe(0.9);
    await waitFor(() =>
      expect(getByLabelText('fullscreen').parentElement).not.toBeDisabled(),
    );
  });

  it('should display the OpenChannel modal', async () => {
    const { getByText, findByText, store } = renderComponent();
    expect(await findByText('backend1')).toBeInTheDocument();
    act(() => {
      store.getActions().modals.showOpenChannel({});
    });
    expect(await findByText('Capacity (sats)')).toBeInTheDocument();
    fireEvent.click(getByText('Cancel'));
  });

  it('should display the CreateInvoice modal', async () => {
    const { getByText, findByText, store } = renderComponent();
    expect(await findByText('backend1')).toBeInTheDocument();
    act(() => {
      store.getActions().modals.showCreateInvoice({});
    });
    expect(await findByText('Amount (sats)')).toBeInTheDocument();
    fireEvent.click(getByText('Cancel'));
  });

  it('should display the PayInvoice modal', async () => {
    const { getByText, findByText, store } = renderComponent();
    expect(await findByText('backend1')).toBeInTheDocument();
    act(() => {
      store.getActions().modals.showPayInvoice({});
    });
    expect(await findByText('BOLT 11 Invoice')).toBeInTheDocument();
    fireEvent.click(getByText('Cancel'));
  });
  it('should display the ChangeTapBackend modal', async () => {
    const { findAllByText, findByText, getAllByText, store } = renderComponent();
    expect(await findByText('backend1')).toBeInTheDocument();
    act(() => {
      store.getActions().modals.showChangeTapBackend({});
    });
    expect(await findAllByText('Change TAP Node Backend')).toHaveLength(1);
    fireEvent.click(getAllByText('Cancel')[0]);
  });

  it('should display the ChangeBackend modal', async () => {
    const { getByText, findByText, store } = renderComponent();
    expect(await findByText('backend1')).toBeInTheDocument();
    act(() => {
      store.getActions().modals.showChangeBackend({});
    });
    expect(await findByText('Lightning Node')).toBeInTheDocument();
    fireEvent.click(getByText('Cancel'));
  });

  it('should display the Send Onchain modal', async () => {
    const { getByText, findByText, store } = renderComponent();
    expect(await findByText('backend1')).toBeInTheDocument();
    act(() => {
      store.getActions().modals.showSendOnChain({});
    });
    expect(await findByText('Send To Onchain Address')).toBeInTheDocument();
    fireEvent.click(getByText('Cancel'));
  });

  it('should display the Mint Asset modal', async () => {
    const { getByText, findByText, store } = renderComponent();
    expect(await findByText('backend1')).toBeInTheDocument();
    act(() => {
      store.getActions().modals.showMintAsset({ nodeName: 'alice-tap' });
    });
    expect(await findByText('Mint an asset for alice-tap')).toBeInTheDocument();
    fireEvent.click(getByText('Cancel'));
  });

  it('should display the New Address modal', async () => {
    const { getByText, findByText, store } = renderComponent();
    expect(await findByText('backend1')).toBeInTheDocument();
    act(() => {
      store.getActions().modals.showNewAddress({ nodeName: 'alice-tap' });
    });
    expect(
      await findByText('Generate new TAP address for alice-tap'),
    ).toBeInTheDocument();
    fireEvent.click(getByText('Cancel'));
  });

  it('should display the Send Address modal', async () => {
    const { getByText, findByText, store } = renderComponent();
    expect(await findByText('backend1')).toBeInTheDocument();
    act(() => {
      store.getActions().modals.showSendAsset({ nodeName: 'alice-tap' });
    });
    expect(await findByText('Send Asset from alice-tap')).toBeInTheDocument();
    fireEvent.click(getByText('Cancel'));
  });

  it('should display the AdvancedOptions modal', async () => {
    const { getByText, findByText, store } = renderComponent();
    expect(await findByText('backend1')).toBeInTheDocument();
    act(() => {
      store.getActions().modals.showAdvancedOptions({});
    });
    expect(await findByText('Docker Startup Command')).toBeInTheDocument();
    fireEvent.click(getByText('Cancel'));
  });

  it('should remove a node from the network', async () => {
    const { getByText, findByText, queryByText, store } = renderComponent();
    // add a new LN node that doesn't have a tap node connected
    store.getActions().designer.onCanvasDrop({
      config: { snapToGrid: true },
      data: { type: 'LND', version: testRepoState.images.LND.latest },
      position: { x: 584, y: 343 },
      id: 'c815fd9d-bbeb-4263-ad96-00bc488d8d60',
    });

    expect(await findByText('carol')).toBeInTheDocument();
    act(() => {
      fireEvent.click(getByText('carol'));
    });
    fireEvent.click(await findByText('Actions'));
    fireEvent.click(await findByText('Remove'));
    fireEvent.click(await findByText('Yes'));
    await waitForElementToBeRemoved(() => queryByText('Yes'));
    expect(queryByText('carol')).toBeNull();
  });

  it('should not remove an LND node with a connected tapd node', async () => {
    const { getByText, findByText } = renderComponent();
    expect(await findByText('alice')).toBeInTheDocument();
    act(() => {
      fireEvent.click(getByText('alice'));
    });
    fireEvent.click(await findByText('Actions'));
    fireEvent.click(await findByText('Remove'));
    fireEvent.click(await findByText('Yes'));

    await suppressConsoleErrors(async () => {
      expect(
        await findByText(
          'Cannot remove a Lightning node that has a Taproot Assets node connected to it.',
        ),
      ).toBeInTheDocument();
    });
  });

  it('should remove a TAP node from the network', async () => {
    const { getByText, findByText, queryByText } = renderComponent();
    expect(await findByText('alice-tap')).toBeInTheDocument();
    act(() => {
      fireEvent.click(getByText('alice-tap'));
    });
    fireEvent.click(await findByText('Actions'));
    fireEvent.click(await findByText('Remove'));
    fireEvent.click(await findByText('Yes'));
    await waitForElementToBeRemoved(() => queryByText('Yes'));
    expect(queryByText('alice-tap')).toBeNull();
  });

  it('should render the dark links', async () => {
    const { container } = renderComponent(undefined, 'dark');
    // look for the first lineargradient tag
    const query = 'lineargradient#lg-alice-backend1';
    const gradientEl = container.querySelector(query) as Element;
    // get the color of the first stop in the gradient
    const color = (gradientEl.firstElementChild as Element).getAttribute('stop-color');
    // the color should be pulled from the theme
    expect(color).toBe(themeColors.dark.link.default);
  });

  it('should render the light links', async () => {
    const { container } = renderComponent(undefined, 'light');
    // look for the first lineargradient tag
    const query = 'lineargradient#lg-alice-backend1';
    const gradientEl = container.querySelector(query) as Element;
    // get the color of the first stop in the gradient
    const color = (gradientEl.firstElementChild as Element).getAttribute('stop-color');
    // the color should be pulled from the theme
    expect(color).toBe(themeColors.light.link.default);
  });
});
