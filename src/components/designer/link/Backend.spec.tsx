import React from 'react';
import { render } from '@testing-library/react';
import { Status } from 'shared/types';
import { getNetwork } from 'utils/tests';
import Backend from './Backend';

describe('Backend component', () => {
  const renderComponent = () => {
    const network = getNetwork();
    const bitcoind = network.nodes.bitcoin[0];
    const lnd = network.nodes.lightning[0];
    const result = render(<Backend bitcoinNode={bitcoind} lightningNode={lnd} />);
    return {
      ...result,
      bitcoind,
      lnd,
    };
  };

  describe('LND Details', () => {
    it('should display Name', () => {
      const { getByText, lnd } = renderComponent();
      expect(getByText(lnd.name)).toBeInTheDocument();
    });

    it('should display Implementation', () => {
      const { getByText, getAllByText, lnd } = renderComponent();
      expect(getAllByText('Implementation')).toHaveLength(2);
      expect(getByText(lnd.implementation)).toBeInTheDocument();
    });

    it('should display Version', () => {
      const { getByText, getAllByText, lnd } = renderComponent();
      expect(getAllByText('Version')).toHaveLength(2);
      expect(getByText(`v${lnd.version}`)).toBeInTheDocument();
    });

    it('should display Status', () => {
      const { getAllByText, lnd } = renderComponent();
      expect(getAllByText('Status')).toHaveLength(2);
      expect(getAllByText(Status[lnd.status])).toHaveLength(2);
    });
  });

  describe('Bitcoind Details', () => {
    it('should display Name', () => {
      const { getByText, bitcoind } = renderComponent();
      expect(getByText(bitcoind.name)).toBeInTheDocument();
    });

    it('should display Implementation', () => {
      const { getByText, bitcoind } = renderComponent();
      expect(getByText(bitcoind.implementation)).toBeInTheDocument();
    });

    it('should display Version', () => {
      const { getByText, bitcoind } = renderComponent();
      expect(getByText(`v${bitcoind.version}`)).toBeInTheDocument();
    });
  });
});
