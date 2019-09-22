import React from 'react';
import { Status } from 'types';
import { getNetwork, injections, renderWithProviders } from 'utils/tests';
import BitcoindDetails from './BitcoindDetails';

describe('BitcoindDetails', () => {
  const renderComponent = (status?: Status) => {
    const network = getNetwork(1, 'test network', status);
    const initialState = {
      network: {
        networks: [network],
      },
    };
    const node = network.nodes.bitcoin[0];
    const cmp = <BitcoindDetails node={node} />;
    const result = renderWithProviders(cmp, { initialState });
    return {
      ...result,
      node,
    };
  };

  describe('with node Stopped', () => {
    it('should display Node Type', () => {
      const { getByText, node } = renderComponent();
      expect(getByText('Node Type')).toBeInTheDocument();
      expect(getByText(node.type)).toBeInTheDocument();
    });

    it('should display Implementation', () => {
      const { getByText, node } = renderComponent();
      expect(getByText('Implementation')).toBeInTheDocument();
      expect(getByText(node.implementation)).toBeInTheDocument();
    });

    it('should display Version', () => {
      const { getByText, node } = renderComponent();
      expect(getByText('Version')).toBeInTheDocument();
      expect(getByText(`v${node.version}`)).toBeInTheDocument();
    });

    it('should display Status', () => {
      const { getByText, node } = renderComponent();
      expect(getByText('Status')).toBeInTheDocument();
      expect(getByText(Status[node.status])).toBeInTheDocument();
    });

    it('should not display Block Height', () => {
      const { queryByText } = renderComponent();
      expect(queryByText('Block Height')).toBeNull();
    });
  });

  describe('with node Started', () => {
    const chainMock = injections.bitcoindService.getBlockchainInfo as jest.Mock;
    const walletMock = injections.bitcoindService.getWalletInfo as jest.Mock;

    beforeEach(() => {
      chainMock.mockResolvedValue({ blocks: 123, bestblockhash: 'abcdef' });
      walletMock.mockResolvedValue({ balance: 10 });
    });

    it('should display correct Status', async () => {
      const { findByText, node } = renderComponent(Status.Started);
      expect(await findByText('Status')).toBeInTheDocument();
      expect(await findByText(Status[node.status])).toBeInTheDocument();
    });

    it('should display RPC Host', async () => {
      const { findByText, node } = renderComponent(Status.Started);
      expect(await findByText('RPC Host')).toBeInTheDocument();
      expect(await findByText(`127.0.0.1:${node.ports.rpc}`)).toBeInTheDocument();
    });

    it('should display Wallet Balance', async () => {
      const { findByText } = renderComponent(Status.Started);
      expect(await findByText('Wallet Balance')).toBeInTheDocument();
      expect(await findByText('10 BTC')).toBeInTheDocument();
    });

    it('should display Block Height', async () => {
      const { findByText } = renderComponent(Status.Started);
      expect(await findByText('Block Height')).toBeInTheDocument();
      expect(await findByText('123')).toBeInTheDocument();
    });

    it('should display Block Hash', async () => {
      const { findByText } = renderComponent(Status.Started);
      expect(await findByText('Block Hash')).toBeInTheDocument();
      expect(await findByText('abcdef')).toBeInTheDocument();
    });

    it('should display an error if data fetching fails', async () => {
      walletMock.mockRejectedValue(new Error('connection failed'));
      const { findByText } = renderComponent(Status.Started);
      expect(await findByText('connection failed')).toBeInTheDocument();
    });
  });
});
