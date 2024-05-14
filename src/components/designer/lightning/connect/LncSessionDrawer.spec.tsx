import React from 'react';
import { fireEvent } from '@testing-library/react';
import { LitdNode } from 'shared/types';
import { Session } from 'lib/litd/types';
import { Network } from 'types';
import { createLitdNetworkNode } from 'utils/network';
import { ellipseInner } from 'utils/strings';
import {
  defaultLitSession,
  getNetwork,
  injections,
  renderWithProviders,
  testNodeDocker,
  testRepoState,
} from 'utils/tests';
import LncSessionDrawer from './LncSessionDrawer';

const litdServiceMock = injections.litdService as jest.Mocked<
  typeof injections.litdService
>;

describe('LncSessionDrawer', () => {
  let network: Network;
  let node: LitdNode;
  let session: Session;

  const renderComponent = async () => {
    const initialState = {
      network: {
        networks: [network],
      },
    };
    const cmp = <LncSessionDrawer node={node} />;
    const result = renderWithProviders(cmp, { initialState });

    await result.store.getActions().lit.getSessions(node);
    await result.store.getActions().modals.showLncSessionInfo({
      nodeName: node.name,
      sessionId: 'test-id',
    });

    return result;
  };

  beforeEach(() => {
    network = getNetwork(1, 'test network');
    node = createLitdNetworkNode(
      network,
      testRepoState.images.litd.latest,
      testRepoState.images.litd.compatibility,
      testNodeDocker,
    );
    network.nodes.lightning.push(node);

    session = defaultLitSession({
      id: 'test-id',
      label: 'Session 1',
      pairingPhrase: 'confirm typical shoot shock high vast verify wave outdoor frozen',
      mailboxServerAddr: 'mailbox.terminal.lightning.today:443',
      state: 'Created',
      type: 'Admin',
      accountId: 'account-1',
      localPublicKey:
        '038f71e67d1feb0af8075f15722db5a1b98ea9db53fef0b53a5a66653b57a64180',
      remotePublicKey: `7faac4fd5e79d05d73a5163ce37ad674d5658a86ae9486eff68fd61d37241e24`,
      createdAt: 1715168314000,
      expiresAt: 1722944309000,
    });
    litdServiceMock.listSessions.mockResolvedValue([session]);
  });

  it('should display the session info', async () => {
    const { findByText, getByText } = await renderComponent();
    expect(await findByText('Lightning Node Connect Session')).toBeInTheDocument();
    expect(getByText(session.label)).toBeInTheDocument();
    expect(getByText(session.id)).toBeInTheDocument();
    expect(getByText(ellipseInner(session.pairingPhrase))).toBeInTheDocument();
    expect(getByText(ellipseInner(session.mailboxServerAddr))).toBeInTheDocument();
    expect(getByText(session.state)).toBeInTheDocument();
    expect(getByText(session.type)).toBeInTheDocument();
    expect(getByText(ellipseInner(session.accountId))).toBeInTheDocument();
    expect(getByText(ellipseInner(session.localPublicKey))).toBeInTheDocument();
    expect(getByText(ellipseInner(session.remotePublicKey))).toBeInTheDocument();
    expect(getByText(new Date(session.createdAt).toLocaleString())).toBeInTheDocument();
    expect(getByText(new Date(session.expiresAt).toLocaleString())).toBeInTheDocument();
  });

  it('should revoke a session', async () => {
    const { findByText, getByText } = await renderComponent();
    expect(await findByText('Lightning Node Connect Session')).toBeInTheDocument();

    expect(getByText('Revoke Session')).toBeInTheDocument();
    fireEvent.click(getByText('Revoke Session'));
    expect(
      await findByText('Are you sure you want to revoke this session?'),
    ).toBeInTheDocument();
    fireEvent.click(getByText('Yes'));
    expect(litdServiceMock.revokeSession).toHaveBeenCalledWith(
      node,
      session.localPublicKey,
    );
    expect(await findByText('The LNC session has been revoked')).toBeInTheDocument();
  });

  it('should display an error if revoking fails', async () => {
    litdServiceMock.revokeSession.mockRejectedValue(new Error('revoke error'));
    const { findByText, getByText } = await renderComponent();
    expect(await findByText('Lightning Node Connect Session')).toBeInTheDocument();

    expect(getByText('Revoke Session')).toBeInTheDocument();
    fireEvent.click(getByText('Revoke Session'));
    expect(
      await findByText('Are you sure you want to revoke this session?'),
    ).toBeInTheDocument();
    fireEvent.click(getByText('Yes'));
    expect(litdServiceMock.revokeSession).toHaveBeenCalledWith(
      node,
      session.localPublicKey,
    );
    expect(await findByText('Unable to revoke the LNC session')).toBeInTheDocument();
    expect(await findByText('revoke error')).toBeInTheDocument();
    expect(getByText('Revoke Session')).toBeInTheDocument();
  });

  it('should display not found for a missing session', async () => {
    const { findByText, store } = await renderComponent();
    store.getActions().lit.clearNodes();
    expect(await findByText('Lightning Node Connect Session')).toBeInTheDocument();
    expect(await findByText('Session test-id Not Found')).toBeInTheDocument();
  });
});
