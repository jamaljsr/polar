import React from 'react';
import { fireEvent, wait } from '@testing-library/dom';
import { ipcChannels } from 'shared';
import { BitcoinNode, LightningNode } from 'shared/types';
import { Network } from 'types';
import { getNetwork, injections, renderWithProviders } from 'utils/tests';
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

  it('should send an ipc message when the button is clicked', async () => {
    const ipcMock = injections.ipc as jest.Mock;
    ipcMock.mockResolvedValue(true);
    const { getByText } = renderComponent(n => n.nodes.bitcoin[0]);
    await wait(() => fireEvent.click(getByText('Launch')));
    const url = '/terminal/bitcoind/polar-n1-backend1';
    expect(ipcMock).toBeCalledWith(ipcChannels.openWindow, { url });
  });
});
