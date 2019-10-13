import React from 'react';
import { ILink } from '@mrblenny/react-flow-chart';
import { render } from '@testing-library/react';
import { getNetwork } from 'utils/tests';
import LinkDetails from './LinkDetails';

describe('LinkDetails component', () => {
  const renderComponent = (from: string, to: string, properties: any) => {
    const network = getNetwork();
    const link: ILink = {
      id: 'asdf',
      from: { nodeId: from, portId: 'asdf' },
      to: { nodeId: to, portId: 'asdf' },
      properties,
    };
    const result = render(<LinkDetails link={link} network={network} />);
    return { ...result, link, network };
  };

  it('should display channel details', () => {
    const properties = {
      type: 'open-channel',
      capacity: '1000',
      fromBalance: '600',
      toBalance: '400',
      direction: 'ltr',
      status: 'Open',
    };
    const { getByText } = renderComponent('lnd-1', 'lnd-2', properties);
    expect(getByText('Channel Details')).toBeInTheDocument();
  });

  it('should display channel details', () => {
    const properties = {
      type: 'backend',
    };
    const { getByText } = renderComponent('lnd-1', 'bitcoind-1', properties);
    expect(getByText('Blockchain Backend Connection')).toBeInTheDocument();
  });

  it('should display message for invalid properties', () => {
    const { getByText } = renderComponent('lnd-1', 'fake', undefined);
    expect(getByText(/select an invalid link/)).toBeInTheDocument();
  });

  it('should display message for invalid lightning node', () => {
    const properties = { type: 'open-channel' };
    const { getByText } = renderComponent('fake', 'bitcoind', properties);
    expect(getByText(/select an invalid link/)).toBeInTheDocument();
  });

  it('should display message for invalid bitcoin node', () => {
    const properties = { type: 'backend' };
    const { getByText } = renderComponent('lnd-1', 'fake', properties);
    expect(getByText(/select an invalid link/)).toBeInTheDocument();
  });
});
