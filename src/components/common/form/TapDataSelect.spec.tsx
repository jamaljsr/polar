import React from 'react';
import { fireEvent } from '@testing-library/react';
import { Status } from 'shared/types';
import { initChartFromNetwork } from 'utils/chart';
import {
  defaultTapAsset,
  defaultTapBalance,
  getNetwork,
  renderWithProviders,
} from 'utils/tests';
import TapDataSelect from './TapDataSelect';

describe('TapDataSelect', () => {
  const handleChange: jest.Mock | undefined = jest.fn();

  const renderComponent = (selectBalances = true, changeEvent = true) => {
    const network = getNetwork(1, 'test network', Status.Started.toString(), 3);
    const initialState = {
      tap: {
        nodes: {
          'alice-tap': {
            balances: [],
            assets: [],
          },
          'bob-tap': {
            balances: [defaultTapBalance({ name: 'bobs-test-balance' })],
            assets: [defaultTapAsset({ name: 'bobs-test-asset' })],
          },
          'dave-tap': {
            balances: [],
            assets: [defaultTapAsset({ name: 'dave-test-asset' })],
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
      <TapDataSelect
        name="tapNode"
        label="Select TAP Asset"
        tapNetworkNodes={network.nodes.tap}
        selectBalances={selectBalances}
        onChange={changeEvent ? handleChange : undefined}
      />
    );
    return renderWithProviders(cmp, { initialState, wrapForm: true });
  };

  it('should display the label and input', () => {
    const { getByText, getByLabelText } = renderComponent();
    expect(getByText('Select TAP Asset')).toBeInTheDocument();
    expect(getByLabelText('Select TAP Asset')).toBeInTheDocument();
  });

  it('should display the balances in groups', () => {
    const { getByLabelText, getByText, queryByText } = renderComponent();
    fireEvent.mouseDown(getByLabelText('Select TAP Asset'));
    expect(getByText('bob-tap')).toBeInTheDocument();
    expect(queryByText('dave-tap')).not.toBeInTheDocument();
    expect(getByText('bobs-test-balance')).toBeInTheDocument();
  });

  it('should display the assets in groups', () => {
    const { getByLabelText, getByText } = renderComponent(false);
    fireEvent.mouseDown(getByLabelText('Select TAP Asset'));
    expect(getByText('bob-tap')).toBeInTheDocument();
    expect(getByText('bobs-test-asset')).toBeInTheDocument();
  });

  it('should select an asset', () => {
    const { queryByText, getByLabelText, getByText, getAllByText } =
      renderComponent(false);
    expect(queryByText('bobs-test-balance-1')).not.toBeInTheDocument();
    fireEvent.mouseDown(getByLabelText('Select TAP Asset'));
    expect(getByText('bob-tap')).toBeInTheDocument();
    expect(getByText('bobs-test-asset')).toBeInTheDocument();
    fireEvent.click(getByText('bobs-test-asset'));
    expect(getAllByText('bobs-test-asset')[1]).toBeInTheDocument();
  });

  it('should not call onChange', () => {
    const { queryByText, getByLabelText, getByText } = renderComponent(false, false);
    expect(queryByText('bobs-test-balance-1')).not.toBeInTheDocument();
    fireEvent.mouseDown(getByLabelText('Select TAP Asset'));
    expect(getByText('bob-tap')).toBeInTheDocument();
    expect(getByText('bobs-test-asset')).toBeInTheDocument();
    fireEvent.click(getByText('bobs-test-asset'));
    expect(handleChange).not.toHaveBeenCalled();
  });
});
