import React from 'react';
import { ILink } from '@mrblenny/react-flow-chart';
import { Status } from 'shared/types';
import { LinkProperties } from 'utils/chart';
import { createBitcoindNetworkNode } from 'utils/network';
import { getNetwork, renderWithProviders, testNodeDocker } from 'utils/tests';
import LinkDetails from './LinkDetails';

describe('LinkDetails component', () => {
  const renderComponent = (from: string, to: string, properties: any) => {
    const network = getNetwork(1, 'test network', Status.Stopped?.toString(), 2);
    network.nodes.bitcoin.push(
      createBitcoindNetworkNode(network, '0.18.1', testNodeDocker),
    );

    const link: ILink = {
      id: 'asdf',
      from: { nodeId: from, portId: 'asdf' },
      to: { nodeId: to, portId: 'asdf' },
      properties,
    };
    const result = renderWithProviders(<LinkDetails link={link} network={network} />);
    return { ...result, link, network };
  };

  it('should display channel details', () => {
    const properties: LinkProperties = {
      type: 'open-channel',
      capacity: '1000',
      fromBalance: '600',
      toBalance: '400',
      direction: 'ltr',
      status: 'Open',
      isPrivate: false,
      channelPoint: 'xxxxxxxxxxxxxxxx:0',
    };
    const { getByText } = renderComponent('alice', 'bob', properties);
    expect(getByText('Channel Details')).toBeInTheDocument();
  });

  it('should display backend connection details', () => {
    const properties = { type: 'backend' };
    const { getByText } = renderComponent('alice', 'backend1', properties);
    expect(getByText('Chain Backend Connection')).toBeInTheDocument();
  });

  it('should display backend peer details', () => {
    const properties = { type: 'btcpeer' };
    const { getByText } = renderComponent('backend1', 'backend2', properties);
    expect(getByText('Bitcoin Peer Connection')).toBeInTheDocument();
  });

  it('should display message for invalid properties', () => {
    const { getByText } = renderComponent('alice', 'fake', undefined);
    expect(getByText(/select an invalid link/)).toBeInTheDocument();
  });

  it('should display message for invalid lightning node', () => {
    const properties = { type: 'open-channel' };
    const { getByText } = renderComponent('fake', 'bitcoind', properties);
    expect(getByText(/select an invalid link/)).toBeInTheDocument();
  });

  it('should display message for invalid bitcoin node', () => {
    const properties = { type: 'backend' };
    const { getByText } = renderComponent('alice', 'fake', properties);
    expect(getByText(/select an invalid link/)).toBeInTheDocument();
  });

  it('should display message for invalid peer connection', () => {
    const properties = { type: 'btcpeer' };
    const { getByText } = renderComponent('backend1', 'fake', properties);
    expect(getByText(/select an invalid link/)).toBeInTheDocument();
  });
  it('should display message for invalid TAP to lnd connection', () => {
    const properties = { type: 'lndbackend' };
    const { getByText } = renderComponent('alice-tap', 'fake', properties);
    expect(getByText(/select an invalid link/)).toBeInTheDocument();
  });
  it('should display message for TAP to Lnd connection', () => {
    const properties = { type: 'lndbackend' };
    const { getByText } = renderComponent('alice-tap', 'alice', properties);
    expect(getByText('TAP Backend Connection')).toBeInTheDocument();
  });
});
