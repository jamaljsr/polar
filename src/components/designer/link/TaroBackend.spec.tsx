import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react';
import { LndNode, Status } from 'shared/types';
import { getNetwork, renderWithProviders } from 'utils/tests';
import TaroBackend from './TaroBackend';

describe('Taro Lnd Link Component', () => {
  const renderComponent = () => {
    const network = getNetwork(1, 'test network', Status.Stopped, 1);
    const from = network.nodes.taro[0];
    const to = network.nodes.lightning[0] as LndNode;
    const result = renderWithProviders(<TaroBackend from={from} to={to} />);
    return {
      ...result,
      from,
      to,
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
  it('should display the ChangeTaroyarn ciBackend modal', async () => {
    const { getByText, store } = renderComponent();
    expect(store.getState().modals.changeTaroBackend.visible).toBe(false);
    fireEvent.click(getByText('Change Backend'));
    await waitFor(() => {
      expect(store.getState().modals.changeTaroBackend.visible).toBe(true);
    });
  });
});
