import React from 'react';
import { fireEvent } from '@testing-library/react';
import { Status } from 'shared/types';
import { initChartFromNetwork } from 'utils/chart';
import {
  defaultTaroAsset,
  defaultTaroBalance,
  getNetwork,
  renderWithProviders,
} from 'utils/tests';
import TaroDataSelect from './TaroDataSelect';

describe('TaroDataSelect', () => {
  const renderComponent = (selectBalances = true) => {
    const network = getNetwork(1, 'test network', Status.Started, 2);
    const initialState = {
      taro: {
        nodes: {
          'alice-taro': {
            balances: [],
            assets: [],
          },
          'bob-taro': {
            balances: [defaultTaroBalance({ name: 'bobs-test-balance' })],
            assets: [defaultTaroAsset({ name: 'bobs-test-asset' })],
          },
          'carol-taro': {
            balances: [],
            assets: [defaultTaroAsset({ name: 'carols-test-asset' })],
          },
        },
      },
      network: {
        networks: [network],
      },
      designer: {
        activeId: network.id,
        allCharts: {
          [network.id]: initChartFromNetwork(network),
        },
      },
    };

    const cmp = (
      <TaroDataSelect
        name="taroNode"
        label="Select Taro Asset"
        taroNetworkNodes={network.nodes.taro}
        selectBalances={selectBalances}
      />
    );
    return renderWithProviders(cmp, { initialState, wrapForm: true });
  };

  it('should display the label and input', () => {
    const { getByText, getByLabelText } = renderComponent();
    expect(getByText('Select Taro Asset')).toBeInTheDocument();
    expect(getByLabelText('Select Taro Asset')).toBeInTheDocument();
  });

  it('should display the balances in groups', () => {
    const { getByLabelText, getByText, queryByText } = renderComponent();
    fireEvent.mouseDown(getByLabelText('Select Taro Asset'));
    expect(getByText('bob-taro')).toBeInTheDocument();
    expect(queryByText('carol-taro')).not.toBeInTheDocument();
    expect(getByText('bobs-test-balance')).toBeInTheDocument();
  });

  it('should display the assets in groups', () => {
    const { getByLabelText, getByText } = renderComponent(false);
    fireEvent.mouseDown(getByLabelText('Select Taro Asset'));
    expect(getByText('bob-taro')).toBeInTheDocument();
    expect(getByText('bobs-test-asset')).toBeInTheDocument();
  });

  it('should select an asset', () => {
    const { queryByText, getByLabelText, getByText, getAllByText } =
      renderComponent(false);
    expect(queryByText('bobs-test-balance-1')).not.toBeInTheDocument();
    fireEvent.mouseDown(getByLabelText('Select Taro Asset'));
    expect(getByText('bob-taro')).toBeInTheDocument();
    expect(getByText('bobs-test-asset')).toBeInTheDocument();
    fireEvent.click(getByText('bobs-test-asset'));
    expect(getAllByText('bobs-test-asset')[1]).toBeInTheDocument();
  });
});
