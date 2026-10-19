import React from 'react';
import { fireEvent } from '@testing-library/react';
import { LightningNode, Status } from 'shared/types';
import { Network } from 'types';
import { createLitdNetworkNode } from 'utils/network';
import {
  getNetwork,
  lndServiceMock,
  renderWithProviders,
  testNodeDocker,
  testRepoState,
} from 'utils/tests';
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

  describe('when the wallet state request fails', () => {
    beforeEach(() => {
      lndServiceMock.getWalletState.mockRejectedValue(new Error('getState-error'));
    });

    it('should display an error instead of spinning forever', async () => {
      const { findByText, queryByLabelText } = renderComponent();
      expect(
        await findByText('Unable to determine the wallet state'),
      ).toBeInTheDocument();
      expect(await findByText('getState-error')).toBeInTheDocument();
      expect(queryByLabelText('loading')).not.toBeInTheDocument();
    });

    it('should not guess an auth flow while the state is unknown', async () => {
      const { findByText, queryByText } = renderComponent();
      await findByText('Unable to determine the wallet state');
      expect(queryByText('GRPC Host')).not.toBeInTheDocument();
      expect(queryByText(/The wallet is locked/)).not.toBeInTheDocument();
      expect(queryByText(/The wallet has not been created/)).not.toBeInTheDocument();
    });

    it('should retry the request when retry is clicked', async () => {
      const { findByText, getByText } = renderComponent();
      await findByText('Unable to determine the wallet state');
      lndServiceMock.getWalletState.mockResolvedValue('LOCKED');
      fireEvent.click(getByText('Retry'));
      expect(await findByText('GRPC Host')).toBeInTheDocument();
    });
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

  describe('with node Started', () => {
    const findNode = (implementation: LightningNode['implementation']) =>
      network.nodes.lightning.find(n => n.implementation === implementation)!;

    const expectHint = async (
      { getByLabelText, findByText }: ReturnType<typeof renderComponent>,
      label: string,
      address: string,
    ) => {
      fireEvent.mouseOver(getByLabelText(`${label} help`));
      expect(await findByText(new RegExp(`use ${address}$`))).toBeInTheDocument();
    };

    beforeEach(() => {
      network.nodes.lightning.forEach(n => (n.status = Status.Started));
    });

    it('should display the container address hints for LND', async () => {
      node = findNode('LND');
      const result = renderComponent();
      await expectHint(result, 'GRPC Host', `polar-n1-${node.name}:10009`);
      await expectHint(result, 'REST Host', `https://polar-n1-${node.name}:8080`);
    });

    it('should display the container address hints for Core Lightning', async () => {
      node = findNode('c-lightning');
      const result = renderComponent();
      await expectHint(result, 'GRPC Host', `polar-n1-${node.name}:11001`);
      await expectHint(result, 'REST Host', `http://polar-n1-${node.name}:8080`);
    });

    it('should display the container address hint for Eclair', async () => {
      node = findNode('eclair');
      const result = renderComponent();
      await expectHint(result, 'REST Host', `http://polar-n1-${node.name}:8080`);
      expect(result.queryByLabelText('GRPC Host help')).not.toBeInTheDocument();
    });

    it('should display the container address hints for litd', async () => {
      node = createLitdNetworkNode(
        network,
        testRepoState.images.litd.latest,
        testRepoState.images.litd.compatibility,
        testNodeDocker,
        Status.Started,
      );
      network.nodes.lightning.push(node);
      const result = renderComponent();
      await expectHint(result, 'GRPC Host', `${node.name}:8443`);
      await expectHint(result, 'REST Host', `https://polar-n1-${node.name}:8080`);
    });

    it('should not display container address hints for P2P addresses', async () => {
      node = findNode('LND');
      const { findByText, queryByLabelText } = renderComponent();
      expect(await findByText('GRPC Host')).toBeInTheDocument();
      expect(queryByLabelText('P2P Internal help')).not.toBeInTheDocument();
      expect(queryByLabelText('P2P External help')).not.toBeInTheDocument();
    });
  });
});
