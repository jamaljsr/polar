import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react';
import { ipcChannels } from 'shared';
import { BitcoinNode, LightningNode } from 'shared/types';
import { Network } from 'types';
import { getNetwork, injections, renderWithProviders } from 'utils/tests';
import ViewLogsButton from './ViewLogsButton';

describe('ViewLogsButton', () => {
  const renderComponent = (nodeSelector: (n: Network) => LightningNode | BitcoinNode) => {
    const network = getNetwork(1, 'test network');
    return renderWithProviders(<ViewLogsButton node={nodeSelector(network)} />, {
      wrapForm: true,
    });
  };

  it('should render label', () => {
    const { getByText } = renderComponent(n => n.nodes.bitcoin[0]);
    expect(getByText('Docker Node Logs')).toBeInTheDocument();
  });

  it('should render button', () => {
    const { getByText } = renderComponent(n => n.nodes.bitcoin[0]);
    expect(getByText('View Logs')).toBeInTheDocument();
  });

  it('should send an ipc message when the button is clicked', async () => {
    const ipcMock = injections.ipc as jest.Mock;
    ipcMock.mockResolvedValue(true);
    const { getByText } = renderComponent(n => n.nodes.lightning[0]);
    fireEvent.click(getByText('View Logs'));
    const url = '/logs/LND/polar-n1-alice';
    await waitFor(() => {
      expect(ipcMock).toBeCalledWith(ipcChannels.openWindow, { url });
    });
  });
});
