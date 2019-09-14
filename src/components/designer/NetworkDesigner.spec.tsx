import React from 'react';
import { IChart } from '@mrblenny/react-flow-chart';
import * as chartCallbacks from '@mrblenny/react-flow-chart/src/container/actions';
import { fireEvent, wait } from '@testing-library/dom';
import { getNetwork, renderWithProviders } from 'utils/tests';
import NetworkDesigner from './NetworkDesigner';

// mock the chart actions so that we can track when they are called
jest.mock('@mrblenny/react-flow-chart/src/container/actions', () => {
  const actualCallbacks = jest.requireActual(
    '@mrblenny/react-flow-chart/src/container/actions',
  );
  return {
    ...actualCallbacks,
    onNodeClick: jest.fn(),
  };
});

const mockChartCallbacks = chartCallbacks as jest.Mocked<typeof chartCallbacks>;

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

  const renderComponent = () => {
    const network = getNetwork(1, 'test network');
    const initialState = {
      network: {
        networks: [network],
      },
    };
    const cmp = <NetworkDesigner network={network} updateStateDelay={0} />;
    return renderWithProviders(cmp, { initialState });
  };

  it('should render the designer component', () => {
    const { getByTestId } = renderComponent();
    expect(getByTestId('designer')).toBeInTheDocument();
  });

  it('should execute onNodeClick callback', () => {
    const { onNodeClick } = jest.requireActual(
      '@mrblenny/react-flow-chart/src/container/actions',
    );
    mockChartCallbacks.onNodeClick.mockImplementation(onNodeClick);
    const { getByText } = renderComponent();
    fireEvent.click(getByText('lnd-1'));
    expect(mockChartCallbacks.onNodeClick).toBeCalledTimes(1);
  });

  it('should render correct # of LND nodes', () => {
    const { queryAllByText } = renderComponent();
    expect(queryAllByText(/lnd-\d/)).toHaveLength(2);
  });

  it('should render correct # of bitcoind nodes', () => {
    const { queryAllByText } = renderComponent();
    expect(queryAllByText(/bitcoind-\d/)).toHaveLength(1);
  });

  it('should update the redux state after a delay', async () => {
    const { onNodeClick } = jest.requireActual(
      '@mrblenny/react-flow-chart/src/container/actions',
    );
    mockChartCallbacks.onNodeClick.mockImplementation(onNodeClick);
    const { getByText, store } = renderComponent();
    expect(store.getState().network.networks[0].design).not.toBeNull();
    fireEvent.click(getByText('lnd-1'));

    await wait(() => {
      const design = store.getState().network.networks[0].design as IChart;
      expect(design.selected.id).not.toBeUndefined();
    });
  });
});
