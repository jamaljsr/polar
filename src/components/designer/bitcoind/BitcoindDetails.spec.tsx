import React from 'react';
import { waitForElement } from '@testing-library/dom';
import { Status } from 'shared/types';
import { getNetwork, injections, renderWithProviders } from 'utils/tests';
import BitcoindDetails from './BitcoindDetails';

describe('BitcoindDetails', () => {
  const renderComponent = (status?: Status) => {
    const network = getNetwork(1, 'test network', status);
    if (status === Status.Error) {
      network.nodes.bitcoin.forEach(n => (n.errorMsg = 'test-error'));
    }
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
    it('should display Node Type', async () => {
      const { findByText, node } = renderComponent();
      expect(await findByText('Node Type')).toBeInTheDocument();
      expect(await findByText(node.type)).toBeInTheDocument();
    });

    it('should display Implementation', async () => {
      const { findByText, node } = renderComponent();
      expect(await findByText('Implementation')).toBeInTheDocument();
      expect(await findByText(node.implementation)).toBeInTheDocument();
    });

    it('should display Version', async () => {
      const { findByText, node } = renderComponent();
      expect(await findByText('Version')).toBeInTheDocument();
      expect(await findByText(`v${node.version}`)).toBeInTheDocument();
    });

    it('should display Status', async () => {
      const { findByText, node } = renderComponent();
      expect(await findByText('Status')).toBeInTheDocument();
      expect(await findByText(Status[node.status])).toBeInTheDocument();
    });

    it('should not display Block Height', async () => {
      const { queryByText, getByText } = renderComponent();
      // first wait for the loader to go away
      await waitForElement(() => getByText('Status'));
      // then confirm GRPC Host isn't there
      expect(queryByText('Block Height')).toBeNull();
    });
  });

  describe('with node Starting', () => {
    it('should display correct Status', async () => {
      const { findByText, node } = renderComponent(Status.Starting);
      expect(await findByText('Status')).toBeInTheDocument();
      expect(await findByText(Status[node.status])).toBeInTheDocument();
    });

    it('should display info alert', async () => {
      const { findByText } = renderComponent(Status.Starting);
      expect(await findByText('Waiting for bitcoind to come online')).toBeInTheDocument();
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

    it('should display the wallet balance of a selected bitcoin node', async () => {
      const { findByText } = renderComponent(Status.Started);
      expect(await findByText('1,000,000,000 sats')).toBeInTheDocument();
    });
  });

  describe('with node Error', () => {
    it('should display correct Status', async () => {
      const { findByText, node } = renderComponent(Status.Error);
      expect(await findByText('Status')).toBeInTheDocument();
      expect(await findByText(Status[node.status])).toBeInTheDocument();
    });

    it('should display correct Status', async () => {
      const { findByText } = renderComponent(Status.Error);
      expect(await findByText('Unable to connect to bitcoin node')).toBeInTheDocument();
      expect(await findByText('test-error')).toBeInTheDocument();
    });
  });
});
