import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react';
import { LndNode, Status } from 'shared/types';
import { initChartFromNetwork } from 'utils/chart';
import * as files from 'utils/files';
import { getNetwork, renderWithProviders } from 'utils/tests';
import TapBackend from './TapBackend';

jest.mock('utils/files', () => ({
  exists: jest.fn(),
}));
const filesMock = files as jest.Mocked<typeof files>;

describe('TAP Lnd Link Component', () => {
  const renderComponent = () => {
    const network = getNetwork(1, 'test network', Status.Stopped?.toString(), 1);
    const allCharts = {
      1: initChartFromNetwork(network),
    };
    const from = network.nodes.tap[0];
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
    const cmp = <TapBackend from={from} to={to} />;
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
  beforeEach(() => {
    filesMock.exists.mockResolvedValue(Promise.resolve(false));
  });
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
    const { getByText, from, to } = renderComponent();
    expect(getByText(`v${from.version}`)).toBeInTheDocument();
    expect(getByText(`v${to.version}`)).toBeInTheDocument();
  });
  describe('Change Tapd Backend Button', () => {
    it('should display the ChangeTapBackend modal', async () => {
      const { getByText, store } = renderComponent();
      expect(store.getState().modals.changeTapBackend.visible).toBe(false);
      fireEvent.click(getByText('Change TAP Backend'));
      await waitFor(() => {
        expect(store.getState().modals.changeTapBackend.visible).toBe(true);
      });
    });
    it('should display an error', async () => {
      filesMock.exists.mockResolvedValue(Promise.resolve(true));
      const { getByText, store, network } = renderComponent();
      expect(store.getState().modals.changeTapBackend.visible).toBe(false);
      await waitFor(() => {
        store.getActions().network.setStatus({ id: network.id, status: Status.Started });
      });
      fireEvent.click(getByText('Change TAP Backend'));
      await waitFor(() => {
        expect(
          getByText(
            'Can only change TAP Backend before the network is started. admin.macaroon is present',
          ),
        ).toBeInTheDocument();
      });
    });
  });
});
