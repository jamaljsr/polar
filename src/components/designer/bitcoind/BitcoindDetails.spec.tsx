import React from 'react';
import { shell } from 'electron';
import { fireEvent, wait, waitForElement } from '@testing-library/dom';
import { Status } from 'shared/types';
import { bitcoinCredentials } from 'utils/constants';
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

    it('should display start msg in Connect tab', async () => {
      const { getByText } = renderComponent(Status.Starting);
      await wait(() => fireEvent.click(getByText('Connect')));
      expect(
        getByText('Node needs to be started to view connection info'),
      ).toBeInTheDocument();
    });
  });

  describe('with node Started', () => {
    const chainMock = injections.bitcoindService.getBlockchainInfo as jest.Mock;
    const walletMock = injections.bitcoindService.getWalletInfo as jest.Mock;

    beforeEach(() => {
      chainMock.mockResolvedValue({ blocks: 123, bestblockhash: 'abcdef' });
      // eslint-disable-next-line @typescript-eslint/camelcase
      walletMock.mockResolvedValue({ balance: 10, immature_balance: 20 });
    });

    it('should display correct Status', async () => {
      const { findByText, node } = renderComponent(Status.Started);
      expect(await findByText('Status')).toBeInTheDocument();
      expect(await findByText(Status[node.status])).toBeInTheDocument();
    });

    it('should display Spendable Balance', async () => {
      const { findByText, findAllByText } = renderComponent(Status.Started);
      expect(await findByText('Spendable Balance')).toBeInTheDocument();
      expect(await findAllByText('10 BTC')).toHaveLength(2);
    });

    it('should display Immature Balance', async () => {
      const { findByText } = renderComponent(Status.Started);
      expect(await findByText('Immature Balance')).toBeInTheDocument();
      expect(await findByText('20 BTC')).toBeInTheDocument();
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

    it('should display RPC Host', async () => {
      const { findByText, node } = renderComponent(Status.Started);
      fireEvent.click(await findByText('Connect'));
      expect(await findByText('RPC Host')).toBeInTheDocument();
      expect(await findByText(`http://127.0.0.1:${node.ports.rpc}`)).toBeInTheDocument();
    });

    it('should display RPC User', async () => {
      const { findByText } = renderComponent(Status.Started);
      fireEvent.click(await findByText('Connect'));
      expect(await findByText('Username')).toBeInTheDocument();
      expect(await findByText(bitcoinCredentials.user)).toBeInTheDocument();
    });

    it('should display RPC Password', async () => {
      const { findByText } = renderComponent(Status.Started);
      fireEvent.click(await findByText('Connect'));
      expect(await findByText('Password')).toBeInTheDocument();
      expect(await findByText(bitcoinCredentials.pass)).toBeInTheDocument();
    });

    it('should open API Doc links in the browser', async () => {
      shell.openExternal = jest.fn().mockResolvedValue(true);
      const { getByText, findByText } = renderComponent(Status.Started);
      fireEvent.click(await findByText('Connect'));
      await wait(() => fireEvent.click(getByText('REST')));
      expect(shell.openExternal).toBeCalledWith(
        'https://bitcoin.org/en/developer-reference#remote-procedure-calls-rpcs',
      );
    });

    it('should not display start msg in Actions tab', async () => {
      const { getByText, queryByText } = renderComponent(Status.Started);
      await wait(() => fireEvent.click(getByText('Actions')));
      expect(queryByText('Node needs to be started to perform actions on it')).toBeNull();
    });

    it('should not display start msg in Connect tab', async () => {
      const { getByText, queryByText } = renderComponent(Status.Started);
      await wait(() => fireEvent.click(getByText('Connect')));
      expect(queryByText('Node needs to be started to view connection info')).toBeNull();
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
