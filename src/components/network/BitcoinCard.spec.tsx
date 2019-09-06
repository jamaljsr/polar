import React from 'react';
import { render } from '@testing-library/react';
import { BitcoinNode, Status } from 'types';
import BitcoindCard from './BitcoindCard';

describe('StatusTag Component', () => {
  const details = [
    { label: 'Block Height', value: '432' },
    { label: 'Wallet Balance', value: '54.00000000' },
    { label: 'Host', value: '159.65.239.204' },
    { label: 'Version', value: 'v0.18.1' },
  ];

  const renderComponent = (status: Status) => {
    const node: BitcoinNode = {
      id: 1,
      name: 'test btc',
      implementation: 'bitcoind',
      version: '0.18.1',
      status,
      type: 'bitcoin',
    };

    return render(<BitcoindCard node={node} details={details} />);
  };

  it('should render the name', () => {
    const { getByText } = renderComponent(Status.Stopped);
    expect(getByText('test btc')).toBeInTheDocument();
  });

  it('should display Stopped when node is stopped', () => {
    const { getByText } = renderComponent(Status.Stopped);
    expect(getByText('Stopped')).toBeInTheDocument();
  });

  it('should render the details when node is started', () => {
    const { getByText } = renderComponent(Status.Started);
    expect(getByText(details[0].label)).toBeInTheDocument();
    expect(getByText(details[0].value)).toBeInTheDocument();
    expect(getByText(details[1].label)).toBeInTheDocument();
    expect(getByText(details[1].value)).toBeInTheDocument();
    expect(getByText(details[2].label)).toBeInTheDocument();
    expect(getByText(details[2].value)).toBeInTheDocument();
    expect(getByText(details[3].label)).toBeInTheDocument();
    expect(getByText(details[3].value)).toBeInTheDocument();
  });
});
