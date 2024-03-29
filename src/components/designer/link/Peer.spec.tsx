import React from 'react';
import { createBitcoindNetworkNode } from 'utils/network';
import { getNetwork, renderWithProviders, testNodeDocker } from 'utils/tests';
import Peer from './Peer';

describe('Peer component', () => {
  const renderComponent = () => {
    const network = getNetwork();
    network.nodes.bitcoin.push(
      createBitcoindNetworkNode(network, '0.18.1', testNodeDocker),
    );
    const [peer1, peer2] = network.nodes.bitcoin.slice(-2);
    const result = renderWithProviders(<Peer from={peer1} to={peer2} />);
    return {
      ...result,
      peer1,
      peer2,
    };
  };

  it('should display Peer Names', () => {
    const { getByText, peer1, peer2 } = renderComponent();
    expect(getByText(peer1.name)).toBeInTheDocument();
    expect(getByText(peer2.name)).toBeInTheDocument();
  });

  it('should display Peer Implementations', () => {
    const { getAllByText, peer2 } = renderComponent();
    expect(getAllByText(peer2.implementation)).toHaveLength(2);
  });

  it('should display Peer Versions', () => {
    const { getByText, peer1, peer2 } = renderComponent();
    expect(getByText(`v${peer1.version}`)).toBeInTheDocument();
    expect(getByText(`v${peer2.version}`)).toBeInTheDocument();
  });
});
