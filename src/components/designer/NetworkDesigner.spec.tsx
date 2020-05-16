import React from 'react';
import { IChart } from '@mrblenny/react-flow-chart';
import { fireEvent, waitForElementToBeRemoved } from '@testing-library/dom';
import { act } from '@testing-library/react';
import { themeColors } from 'theme/colors';
import { initChartFromNetwork } from 'utils/chart';
import { getNetwork, renderWithProviders } from 'utils/tests';
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
    const network = getNetwork(1, 'test network');
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
    };
    const cmp = <NetworkDesigner network={network} updateStateDelay={3000} />;
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
    act(() => {
      fireEvent.click(getByText('backend1'));
    });
    // ensure text from the sidebar is visible
    expect(await findByText('Node Type')).toBeInTheDocument();
  });

  it('should display the OpenChannel modal', async () => {
    const { findByText, store } = renderComponent();
    expect(await findByText('backend1')).toBeInTheDocument();
    act(() => {
      store.getActions().modals.showOpenChannel({});
    });
    expect(await findByText('Capacity (sats)')).toBeInTheDocument();
  });

  it('should display the CreateInvoice modal', async () => {
    const { findByText, store } = renderComponent();
    expect(await findByText('backend1')).toBeInTheDocument();
    act(() => {
      store.getActions().modals.showCreateInvoice({});
    });
    expect(await findByText('Amount (sats)')).toBeInTheDocument();
  });

  it('should display the PayInvoice modal', async () => {
    const { findByText, store } = renderComponent();
    expect(await findByText('backend1')).toBeInTheDocument();
    act(() => {
      store.getActions().modals.showPayInvoice({});
    });
    expect(await findByText('BOLT 11 Invoice')).toBeInTheDocument();
  });

  it('should display the ChangeBackend modal', async () => {
    const { findByText, store } = renderComponent();
    expect(await findByText('backend1')).toBeInTheDocument();
    act(() => {
      store.getActions().modals.showChangeBackend({});
    });
    expect(await findByText('Lightning Node')).toBeInTheDocument();
  });

  it('should display the AdvancedOptions modal', async () => {
    const { findByText, store } = renderComponent();
    expect(await findByText('backend1')).toBeInTheDocument();
    act(() => {
      store.getActions().modals.showAdvancedOptions({});
    });
    expect(await findByText('Docker Startup Command')).toBeInTheDocument();
  });

  it('should remove a node from the network', async () => {
    const { getByText, findByText, queryByText } = renderComponent();
    expect(await findByText('alice')).toBeInTheDocument();
    act(() => {
      fireEvent.click(getByText('alice'));
    });
    fireEvent.click(await findByText('Actions'));
    fireEvent.click(await findByText('Remove'));
    fireEvent.click(await findByText('Yes'));
    await waitForElementToBeRemoved(() => queryByText('Yes'));
    expect(queryByText('alice')).toBeNull();
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
