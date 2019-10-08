import React from 'react';
import { fireEvent, wait, waitForElement } from '@testing-library/dom';
import { LndLibrary, Status } from 'types';
import * as files from 'utils/files';
import {
  getNetwork,
  injections,
  mockLndResponses,
  renderWithProviders,
} from 'utils/tests';
import LndDetails from './LndDetails';

jest.mock('utils/files');

describe('LndDetails', () => {
  const renderComponent = (status?: Status) => {
    const network = getNetwork(1, 'test network', status);
    const initialState = {
      network: {
        networks: [network],
      },
      lnd: {
        nodes: {
          'lnd-1': {},
        },
      },
    };
    const node = network.nodes.lightning[0];
    const cmp = <LndDetails node={node} />;
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

    it('should not display GRPC Host', async () => {
      const { queryByText, getByText } = renderComponent();
      // first wait for the loader to go away
      await waitForElement(() => getByText('Status'));
      // then confirm GRPC Host isn't there
      expect(queryByText('GRPC Host')).toBeNull();
    });

    it('should display start msg in Actions tab', async () => {
      const { findByText } = renderComponent(Status.Starting);
      fireEvent.click(await findByText('Actions'));
      expect(
        await findByText('Start the network to interact with this node'),
      ).toBeInTheDocument();
    });

    it('should display start msg in Actions tab', async () => {
      const { findByText } = renderComponent(Status.Starting);
      fireEvent.click(await findByText('Connect'));
      expect(
        await findByText('Start the network to view connection info'),
      ).toBeInTheDocument();
    });
  });

  describe('with node Starting', () => {
    it('should display correct Status', async () => {
      const { findByText, node } = renderComponent(Status.Starting);
      fireEvent.click(await findByText('Info'));
      expect(await findByText('Status')).toBeInTheDocument();
      expect(await findByText(Status[node.status])).toBeInTheDocument();
    });

    it('should display info alert', async () => {
      const { findByText } = renderComponent(Status.Starting);
      expect(await findByText('Waiting for LND to come online')).toBeInTheDocument();
    });
  });

  describe('with node Started', () => {
    const lndServiceMock = injections.lndService as jest.Mocked<LndLibrary>;

    beforeEach(() => {
      lndServiceMock.getInfo.mockResolvedValue({
        ...mockLndResponses.getInfo,
        alias: 'my-node',
        identityPubkey: 'abcdef',
        syncedToChain: true,
      });
      lndServiceMock.getWalletBalance.mockResolvedValue({
        ...mockLndResponses.getWalletBalance,
        confirmedBalance: '10',
        unconfirmedBalance: '20',
        totalBalance: '30',
      });
    });

    it('should display correct Status', async () => {
      const { findByText, node } = renderComponent(Status.Started);
      fireEvent.click(await findByText('Info'));
      expect(await findByText('Status')).toBeInTheDocument();
      expect(await findByText(Status[node.status])).toBeInTheDocument();
    });

    it('should display Confirmed Balance', async () => {
      const { findByText, findAllByText } = renderComponent(Status.Started);
      fireEvent.click(await findByText('Info'));
      expect(await findByText('Confirmed Balance')).toBeInTheDocument();
      expect(await findAllByText('10 sats')).toHaveLength(2);
    });

    it('should display Unconfirmed Balance', async () => {
      const { findByText } = renderComponent(Status.Started);
      fireEvent.click(await findByText('Info'));
      expect(await findByText('Unconfirmed Balance')).toBeInTheDocument();
      expect(await findByText('20 sats')).toBeInTheDocument();
    });

    it('should display Alias', async () => {
      const { findByText } = renderComponent(Status.Started);
      fireEvent.click(await findByText('Info'));
      expect(await findByText('Alias')).toBeInTheDocument();
      expect(await findByText('my-node')).toBeInTheDocument();
    });

    it('should display Pubkey', async () => {
      const { findByText } = renderComponent(Status.Started);
      fireEvent.click(await findByText('Info'));
      expect(await findByText('Pubkey')).toBeInTheDocument();
      expect(await findByText('abcdef')).toBeInTheDocument();
    });

    it('should display Synced to Chain', async () => {
      const { findByText } = renderComponent(Status.Started);
      fireEvent.click(await findByText('Info'));
      expect(await findByText('Synced to Chain')).toBeInTheDocument();
      expect(await findByText('true')).toBeInTheDocument();
    });

    it('should display the wallet balance in the header', async () => {
      const { findByText } = renderComponent(Status.Started);
      expect(await findByText('10 sats')).toBeInTheDocument();
    });

    it('should display an error if data fetching fails', async () => {
      lndServiceMock.getInfo.mockRejectedValue(new Error('connection failed'));
      const { findByText } = renderComponent(Status.Started);
      expect(await findByText('connection failed')).toBeInTheDocument();
    });

    it('should not display confirmed/unconfirmed balances', async () => {
      lndServiceMock.getWalletBalance.mockResolvedValue(null as any);
      const { getByText, queryByText, findByText } = renderComponent(Status.Started);
      fireEvent.click(await findByText('Info'));
      await wait(() => getByText('Alias'));
      expect(queryByText('Confirmed Balance')).not.toBeInTheDocument();
      expect(queryByText('Unconfirmed Balance')).not.toBeInTheDocument();
    });

    it('should not display LND info if its undefined', async () => {
      lndServiceMock.getInfo.mockResolvedValue(null as any);
      const { getByText, queryByText, findByText } = renderComponent(Status.Started);
      fireEvent.click(await findByText('Info'));
      await wait(() => getByText('Confirmed Balance'));
      expect(queryByText('Alias')).not.toBeInTheDocument();
      expect(queryByText('Pubkey')).not.toBeInTheDocument();
    });

    it('should handle incoming open channel button click', async () => {
      const { findByText, node, store } = renderComponent(Status.Started);
      fireEvent.click(await findByText('Actions'));
      fireEvent.click(await findByText('Incoming'));
      const { visible, to } = store.getState().modals.openChannel;
      expect(visible).toEqual(true);
      expect(to).toEqual(node.name);
    });

    it('should handle outgoing open channel button click', async () => {
      const { findByText, node, store } = renderComponent(Status.Started);
      fireEvent.click(await findByText('Actions'));
      fireEvent.click(await findByText('Outgoing'));
      const { visible, from } = store.getState().modals.openChannel;
      expect(visible).toEqual(true);
      expect(from).toEqual(node.name);
    });

    it('should display hex values for paths', async () => {
      const mockFiles = files as jest.Mocked<typeof files>;
      mockFiles.readHex.mockResolvedValue('test-hex');
      const { findByText, container, getAllByDisplayValue } = renderComponent(
        Status.Started,
      );
      fireEvent.click(await findByText('Connect'));
      expect(files.readHex).toBeCalledTimes(3);
      const hexBtn = container.querySelector(
        'input[name=fileType][value=hex]',
      ) as Element;
      fireEvent.click(hexBtn);
      expect(getAllByDisplayValue('test-hex')).toHaveLength(3);
    });

    it('should display an error if getting hex strings fails', async () => {
      const mockFiles = files as jest.Mocked<typeof files>;
      mockFiles.readHex.mockRejectedValue(new Error('test-error'));
      const { findByText } = renderComponent(Status.Started);
      fireEvent.click(await findByText('Connect'));
      expect(await findByText('Unable to hex encode file contents')).toBeInTheDocument();
      expect(await findByText('test-error')).toBeInTheDocument();
    });
  });
});
