import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react';
import { ipcChannels } from 'shared';
import { BitcoinNode, LightningNode } from 'shared/types';
import { Network } from 'types';
import { addBtcdNode, getNetwork, injections, renderWithProviders } from 'utils/tests';
import OpenTerminalButton from './OpenTerminalButton';

describe('OpenTerminalButton', () => {
  const renderComponent = (nodeSelector: (n: Network) => LightningNode | BitcoinNode) => {
    const network = getNetwork(1, 'test network');
    return renderWithProviders(<OpenTerminalButton node={nodeSelector(network)} />, {
      wrapForm: true,
    });
  };

  it('should render label', () => {
    const { getByText } = renderComponent(n => n.nodes.bitcoin[0]);
    expect(getByText('Terminal')).toBeInTheDocument();
  });

  it('should render button', () => {
    const { getByText } = renderComponent(n => n.nodes.bitcoin[0]);
    expect(getByText('Launch')).toBeInTheDocument();
  });

  it('should render bitcoind help text', () => {
    const { getByText } = renderComponent(n => n.nodes.bitcoin[0]);
    const help = getByText("Run 'bitcoin-cli' commands directly on the node");
    expect(help).toBeInTheDocument();
  });

  it('should render lnd help text', () => {
    const { getByText } = renderComponent(n => n.nodes.lightning[0]);
    const help = getByText("Run 'lncli' commands directly on the node");
    expect(help).toBeInTheDocument();
  });

  it('should render c-lightning help text', () => {
    const { getByText } = renderComponent(n => n.nodes.lightning[1]);
    const help = getByText("Run 'lightning-cli' commands directly on the node");
    expect(help).toBeInTheDocument();
  });

  it('should render btcd help text', () => {
    const network = getNetwork(1, 'test network');
    const btcdNode = addBtcdNode(network);
    const { getByText } = renderWithProviders(<OpenTerminalButton node={btcdNode} />, {
      wrapForm: true,
    });
    const help = getByText("Run 'btcctl' commands directly on the node");
    expect(help).toBeInTheDocument();
  });

  it('should render tapd help text', () => {
    const network = getNetwork(1, 'test network', undefined, 1);
    const { getByText } = renderWithProviders(
      <OpenTerminalButton node={network.nodes.tap[0]} />,
      { wrapForm: true },
    );
    const help = getByText("Run 'tapcli' commands directly on the node");
    expect(help).toBeInTheDocument();
  });

  it('should send an ipc message when the button is clicked', async () => {
    const ipcMock = injections.ipc as jest.Mock;
    ipcMock.mockResolvedValue(true);
    const { getByText } = renderComponent(n => n.nodes.bitcoin[0]);
    fireEvent.click(getByText('Launch'));
    const url = '/terminal/bitcoind/polar-n1-backend1';
    await waitFor(() => {
      expect(ipcMock).toBeCalledWith(ipcChannels.openWindow, { url });
    });
  });
});
