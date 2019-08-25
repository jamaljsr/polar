import React from 'react';
import { renderWithProviders } from 'utils/tests';
import { LightningNode, Status } from 'types';
import LndCard from './LndCard';

describe('StatusTag Component', () => {
  const node: LightningNode = {
    id: 1,
    name: 'test lnd',
    implementation: 'LND',
    status: Status.Stopped,
    type: 'lightning',
    backendName: 'bitcoind-1',
  };

  const details = [
    { label: 'PubKey', value: '0245....5fd47' },
    { label: 'Host', value: '159.65.239.204' },
    { label: 'Synced to Chain', value: 'true' },
    { label: 'Chain Node', value: 'bitcoind1' },
    { label: 'Version', value: 'v0.7.1' },
  ];

  const renderComponent = () => {
    return renderWithProviders(<LndCard node={node} details={details} />);
  };

  it('should render the name', () => {
    const { getByText } = renderComponent();
    expect(getByText(node.name)).toBeTruthy();
  });

  it('should render the details', () => {
    const { getByText } = renderComponent();
    expect(getByText(details[0].label)).toBeTruthy();
    expect(getByText(details[0].value)).toBeTruthy();
    expect(getByText(details[1].label)).toBeTruthy();
    expect(getByText(details[1].value)).toBeTruthy();
    expect(getByText(details[2].label)).toBeTruthy();
    expect(getByText(details[2].value)).toBeTruthy();
    expect(getByText(details[3].label)).toBeTruthy();
    expect(getByText(details[3].value)).toBeTruthy();
    expect(getByText(details[4].label)).toBeTruthy();
    expect(getByText(details[4].value)).toBeTruthy();
  });
});
