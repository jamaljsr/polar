import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react';
import { LitdNode } from 'shared/types';
import { Network } from 'types';
import { createLitdNetworkNode } from 'utils/network';
import {
  defaultLitSession,
  getNetwork,
  injections,
  renderWithProviders,
  testNodeDocker,
  testRepoState,
} from 'utils/tests';
import LncAddSessionModal from './LncAddSessionModal';

const litdServiceMock = injections.litdService as jest.Mocked<
  typeof injections.litdService
>;

describe('LncAddSessionModal', () => {
  let network: Network;
  let node: LitdNode;

  const renderComponent = async () => {
    const initialState = {
      network: {
        networks: [network],
      },
    };
    const cmp = <LncAddSessionModal network={network} />;
    const result = renderWithProviders(cmp, { initialState });
    await result.store.getActions().modals.showAddLncSession({
      nodeName: node.name,
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
  });

  it('should display the form fields', async () => {
    const { findByText, getByText, getByLabelText } = await renderComponent();
    expect(await findByText('Add new LNC Session')).toBeInTheDocument();
    expect(getByText('Session Label')).toBeInTheDocument();
    expect(getByText('Session Type')).toBeInTheDocument();
    expect(getByText('Expiration Date')).toBeInTheDocument();
    expect(getByText('Mailbox Server Address')).toBeInTheDocument();
    expect(getByText('Add Session')).toBeInTheDocument();
    fireEvent.click(getByLabelText('close'));
  });

  it('should close the modal', async () => {
    const { findByText, getByLabelText, store } = await renderComponent();
    expect(await findByText('Add new LNC Session')).toBeInTheDocument();
    fireEvent.click(getByLabelText('close'));
    await waitFor(() => {
      expect(store.getState().modals.addLncSession.visible).toBe(false);
    });
  });

  it('should add a new session with just a label', async () => {
    litdServiceMock.addSession.mockResolvedValue(
      defaultLitSession({
        id: 'test-session',
        label: 'Test Session',
        pairingPhrase: 'confirm typical shoot shock high vast verify wave outdoor frozen',
      }),
    );
    const { findByText, getByLabelText, getByText } = await renderComponent();
    expect(await findByText('Add new LNC Session')).toBeInTheDocument();
    fireEvent.change(getByLabelText('Session Label'), {
      target: { value: 'Test Session' },
    });
    fireEvent.click(getByText('Add Session'));
    await waitFor(() => {
      expect(litdServiceMock.addSession).toHaveBeenCalledWith(
        node,
        'Test Session',
        'Admin',
        expect.any(Number),
        'mailbox.terminal.lightning.today:443',
      );
    });
    expect(await findByText('Successfully added the LNC session')).toBeInTheDocument();

    fireEvent.click(getByText('Copy & Close'));
    expect(getByText('Copied Pairing Phrase to the clipboard')).toBeInTheDocument();
  });

  it('should add a new session with all fields populated', async () => {
    litdServiceMock.addSession.mockResolvedValue(
      defaultLitSession({
        id: 'test-session',
        label: 'Test Session',
        pairingPhrase: 'confirm typical shoot shock high vast verify wave outdoor frozen',
      }),
    );
    const { findByText, getByLabelText, getByText, changeSelect } =
      await renderComponent();
    expect(await findByText('Add new LNC Session')).toBeInTheDocument();
    fireEvent.change(getByLabelText('Session Label'), {
      target: { value: 'Test Session' },
    });
    changeSelect('Session Type', 'Read Only');
    fireEvent.change(getByLabelText('Mailbox Server Address'), {
      target: { value: 'test.server.com' },
    });
    fireEvent.click(getByText('Add Session'));
    await waitFor(() => {
      expect(litdServiceMock.addSession).toHaveBeenCalledWith(
        node,
        'Test Session',
        'Read Only',
        expect.any(Number),
        'test.server.com',
      );
    });
    expect(await findByText('Successfully added the LNC session')).toBeInTheDocument();
    fireEvent.click(getByLabelText('close'));
  });

  it('should display an error if adding the session fails', async () => {
    litdServiceMock.addSession.mockRejectedValue(new Error('Test Error'));
    const { findByText, getByLabelText, getByText } = await renderComponent();
    expect(await findByText('Add new LNC Session')).toBeInTheDocument();
    fireEvent.change(getByLabelText('Session Label'), {
      target: { value: 'Test Session' },
    });
    fireEvent.click(getByText('Add Session'));
    await waitFor(() => {
      expect(litdServiceMock.addSession).toHaveBeenCalledWith(
        node,
        'Test Session',
        'Admin',
        expect.any(Number),
        'mailbox.terminal.lightning.today:443',
      );
    });
    expect(await findByText('Unable to add the Session')).toBeInTheDocument();
    expect(await findByText('Test Error')).toBeInTheDocument();
    fireEvent.click(getByText('Cancel'));
  });

  it('should not add the session if the node cannot be found', async () => {
    const { findByText, getByLabelText, getByText } = await renderComponent();
    expect(await findByText('Add new LNC Session')).toBeInTheDocument();
    fireEvent.change(getByLabelText('Session Label'), {
      target: { value: 'Test Session' },
    });
    network.nodes.lightning = [];
    fireEvent.click(getByText('Add Session'));
    expect(litdServiceMock.addSession).not.toHaveBeenCalled();
    fireEvent.click(getByLabelText('close'));
  });
});
