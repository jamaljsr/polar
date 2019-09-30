import React from 'react';
import { waitForElement } from '@testing-library/dom';
import { LndLibrary, Status } from 'types';
import * as files from 'utils/files';
import {
  getNetwork,
  injections,
  mockLndResponses,
  renderWithProviders,
} from 'utils/tests';
import LndDetails from './LndDetails';

jest.mock('utils/files', () => ({
  waitForFile: jest.fn(),
}));

describe('LndDetails', () => {
  const renderComponent = (status?: Status, initialNodes?: any) => {
    const network = getNetwork(1, 'test network', status);
    const nodes =
      initialNodes ||
      network.nodes.lightning.reduce((acc: Record<string, any>, n) => {
        return {
          ...acc,
          [n.name]: { initialized: true },
        };
      }, {});
    const initialState = {
      network: {
        networks: [network],
      },
      lnd: {
        nodes,
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
  });

  describe('with node Starting', () => {
    it('should display correct Status', async () => {
      const { findByText, node } = renderComponent(Status.Starting);
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
    const filesMock = files as jest.Mocked<typeof files>;

    beforeEach(() => {
      lndServiceMock.getInfo.mockResolvedValue({
        ...mockLndResponses.getInfo,
        alias: 'my-node',
        identityPubkey: 'abcdef',
        syncedToChain: true,
      });
      filesMock.waitForFile.mockResolvedValue(true);
    });

    it('should display correct Status', async () => {
      const { findByText, node } = renderComponent(Status.Started);
      expect(await findByText('Status')).toBeInTheDocument();
      expect(await findByText(Status[node.status])).toBeInTheDocument();
    });

    it('should display GRPC Host', async () => {
      const { findByText, node } = renderComponent(Status.Started);
      expect(await findByText('GRPC Host')).toBeInTheDocument();
      expect(await findByText(`127.0.0.1:${node.ports.grpc}`)).toBeInTheDocument();
    });

    it('should display REST Host', async () => {
      const { findByText, node } = renderComponent(Status.Started);
      expect(await findByText('REST Host')).toBeInTheDocument();
      expect(await findByText(`127.0.0.1:${node.ports.rest}`)).toBeInTheDocument();
    });

    it('should display Alias', async () => {
      const { findByText } = renderComponent(Status.Started);
      expect(await findByText('Alias')).toBeInTheDocument();
      expect(await findByText('my-node')).toBeInTheDocument();
    });

    it('should display Pubkey', async () => {
      const { findByText } = renderComponent(Status.Started);
      expect(await findByText('Pubkey')).toBeInTheDocument();
      expect(await findByText('abcdef')).toBeInTheDocument();
    });

    it('should display Synced to Chain', async () => {
      const { findByText } = renderComponent(Status.Started);
      expect(await findByText('Synced to Chain')).toBeInTheDocument();
      expect(await findByText('true')).toBeInTheDocument();
    });

    it('should display an error if data fetching fails', async () => {
      lndServiceMock.getInfo.mockRejectedValue(new Error('connection failed'));
      const { findByText } = renderComponent(Status.Started);
      expect(await findByText('connection failed')).toBeInTheDocument();
    });
  });
});
