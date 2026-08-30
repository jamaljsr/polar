import React from 'react';
import { LightningNode, Status } from 'shared/types';
import { Network } from 'types';
import { getNetwork, lndServiceMock, renderWithProviders } from 'utils/tests';
import ConnectTab from './ConnectTab';

describe('ConnectTab', () => {
  let network: Network;
  let node: LightningNode;

  const renderComponent = () => {
    const initialState = {
      network: { networks: [network] },
      lightning: { nodes: { alice: {} } },
    };
    const cmp = <ConnectTab node={node} />;
    return renderWithProviders(cmp, { initialState });
  };

  beforeEach(() => {
    network = getNetwork(1, 'test network');
    node = network.nodes.lightning[0];
    node.status = Status.Locked;
  });

  it('should display a loader while wallet state is resolving', async () => {
    lndServiceMock.getWalletState.mockImplementation(() => new Promise(() => {}));
    const { findByLabelText } = renderComponent();
    expect(await findByLabelText('loading')).toBeInTheDocument();
  });

  describe('with wallet LOCKED', () => {
    beforeEach(() => {
      lndServiceMock.getWalletState.mockResolvedValue('LOCKED');
    });

    it('should display connection details instead of the not-started message', async () => {
      const { findByText, queryByText } = renderComponent();
      expect(await findByText('GRPC Host')).toBeInTheDocument();
      expect(
        queryByText('Node needs to be started to view connection info'),
      ).not.toBeInTheDocument();
    });

    it('should display the locked wallet banner', async () => {
      const { findByText } = renderComponent();
      expect(await findByText(/The wallet is locked/)).toBeInTheDocument();
    });

    it('should offer all auth types, including macaroon-dependent ones', async () => {
      const { findByText, getByText } = renderComponent();
      await findByText('GRPC Host');
      expect(getByText('File Paths')).toBeInTheDocument();
      expect(getByText('HEX')).toBeInTheDocument();
      expect(getByText('Base64')).toBeInTheDocument();
      expect(getByText('LND Connect')).toBeInTheDocument();
      expect(getByText('Admin Macaroon')).toBeInTheDocument();
    });
  });

  describe('with wallet NON_EXISTING', () => {
    beforeEach(() => {
      lndServiceMock.getWalletState.mockResolvedValue('NON_EXISTING');
    });

    it('should display endpoints and the TLS cert path only', async () => {
      const { findByText, getByText, queryByText } = renderComponent();
      expect(await findByText('GRPC Host')).toBeInTheDocument();
      expect(getByText('TLS Cert')).toBeInTheDocument();
      expect(queryByText('Admin Macaroon')).not.toBeInTheDocument();
    });

    it('should not offer macaroon-dependent auth types', async () => {
      const { findByText, queryByText } = renderComponent();
      await findByText('GRPC Host');
      expect(queryByText('HEX')).not.toBeInTheDocument();
      expect(queryByText('Base64')).not.toBeInTheDocument();
      expect(queryByText('LND Connect')).not.toBeInTheDocument();
    });

    it('should display the not-initialized banner', async () => {
      const { findByText } = renderComponent();
      expect(await findByText(/wallet has not been created yet/)).toBeInTheDocument();
    });
  });
});
