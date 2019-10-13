import React from 'react';
import { ILink } from '@mrblenny/react-flow-chart';
import { render } from '@testing-library/react';
import { Status } from 'types';
import { getNetwork } from 'utils/tests';
import Channel from './Channel';

describe('Channel component', () => {
  const renderComponent = () => {
    const network = getNetwork();
    const lnd1 = network.nodes.lightning[0];
    const lnd2 = network.nodes.lightning[1];
    const link: ILink = {
      id: 'asdf',
      from: { nodeId: lnd1.name, portId: 'asdf' },
      to: { nodeId: lnd2.name, portId: 'asdf' },
      properties: {
        type: 'open-channel',
        capacity: '1000',
        fromBalance: '600',
        toBalance: '400',
        direction: 'ltr',
        status: 'Open',
      },
    };
    const result = render(<Channel link={link} from={lnd1} to={lnd2} />);
    return { ...result, lnd1, lnd2, link };
  };

  describe('Channel Details', () => {
    it('should display Status', () => {
      const { getAllByText } = renderComponent();
      expect(getAllByText('Status')).toHaveLength(3);
      expect(getAllByText('Stopped')).toHaveLength(2);
    });

    it('should display Capacity', () => {
      const { getByText } = renderComponent();
      expect(getByText('Capacity')).toBeInTheDocument();
      expect(getByText('1,000 sats')).toBeInTheDocument();
    });

    it('should display Source Balance', () => {
      const { getByText } = renderComponent();
      expect(getByText('Source Balance')).toBeInTheDocument();
      expect(getByText('600 sats')).toBeInTheDocument();
    });

    it('should display Destination Balance', () => {
      const { getByText } = renderComponent();
      expect(getByText('Destination Balance')).toBeInTheDocument();
      expect(getByText('600 sats')).toBeInTheDocument();
    });
  });

  describe('LND Details', () => {
    it('should display Name', () => {
      const { getByText } = renderComponent();
      expect(getByText('lnd-1')).toBeInTheDocument();
      expect(getByText('lnd-2')).toBeInTheDocument();
    });

    it('should display Version', () => {
      const { getAllByText, lnd1 } = renderComponent();
      expect(getAllByText(`v${lnd1.version}`)).toHaveLength(2);
    });

    it('should display Status', () => {
      const { getAllByText, lnd1 } = renderComponent();
      expect(getAllByText(Status[lnd1.status])).toHaveLength(2);
    });
  });
});
