import React from 'react';
import { fireEvent } from '@testing-library/dom';
import { act } from '@testing-library/react';
import { ipcChannels } from 'shared';
import { Status } from 'shared/types';
import { initChartFromNetwork } from 'utils/chart';
import { getNetwork, injections, renderWithProviders } from 'utils/tests';
import NodeContextMenu from './NodeContextMenu';

describe('NodeContextMenu', () => {
  const renderComponent = (nodeName: string, status?: Status, activeId?: number) => {
    const network = getNetwork(1, 'test network', status, 2);
    const chart = initChartFromNetwork(network);
    if (nodeName === 'invalid') {
      chart.nodes.alice.id = 'invalid';
      nodeName = 'alice';
    }
    const initialState = {
      network: {
        networks: [network],
      },
      designer: {
        activeId: activeId || network.id,
        allCharts: {
          [network.id]: chart,
        },
      },
    };
    const cmp = (
      <NodeContextMenu node={chart.nodes[nodeName]}>
        <span>test-child</span>
      </NodeContextMenu>
    );
    const result = renderWithProviders(cmp, { initialState });
    // always open the context menu for all tests
    fireEvent.contextMenu(result.getByText('test-child'));
    return result;
  };

  it('should not render menu with no network', () => {
    const { queryByText } = renderComponent('alice', Status.Stopped, -1);
    expect(queryByText('Start')).not.toBeInTheDocument();
  });

  it('should display the correct options for a started lightning node', async () => {
    const { getByText } = renderComponent('alice', Status.Started);
    expect(getByText('Create Invoice')).toBeInTheDocument();
    expect(getByText('Pay Invoice')).toBeInTheDocument();
    expect(getByText('Open Outgoing Channel')).toBeInTheDocument();
    expect(getByText('Open Incoming Channel')).toBeInTheDocument();
    expect(getByText('Launch Terminal')).toBeInTheDocument();
    expect(getByText('Stop')).toBeInTheDocument();
    expect(getByText('View Logs')).toBeInTheDocument();
    expect(getByText('Advanced Options')).toBeInTheDocument();
    expect(getByText('Remove')).toBeInTheDocument();
  });

  it('should display the correct options for a stopped lightning node', async () => {
    const { getByText, queryByText } = renderComponent('alice', Status.Stopped);
    expect(queryByText('Create Invoice')).not.toBeInTheDocument();
    expect(queryByText('Pay Invoice')).not.toBeInTheDocument();
    expect(queryByText('Open Outgoing Channel')).not.toBeInTheDocument();
    expect(queryByText('Open Incoming Channel')).not.toBeInTheDocument();
    expect(queryByText('Launch Terminal')).not.toBeInTheDocument();
    expect(queryByText('View Logs')).not.toBeInTheDocument();
    expect(getByText('Start')).toBeInTheDocument();
    expect(getByText('Advanced Options')).toBeInTheDocument();
    expect(getByText('Remove')).toBeInTheDocument();
  });

  it('should display the correct options for a started bitcoin node', async () => {
    const { getByText } = renderComponent('backend1', Status.Started);
    expect(getByText('Send to Address')).toBeInTheDocument();
    expect(getByText('Launch Terminal')).toBeInTheDocument();
    expect(getByText('Stop')).toBeInTheDocument();
    expect(getByText('View Logs')).toBeInTheDocument();
    expect(getByText('Advanced Options')).toBeInTheDocument();
    expect(getByText('Remove')).toBeInTheDocument();
  });

  it('should display the correct options for a stopped bitcoin node', async () => {
    const { getByText, queryByText } = renderComponent('backend1', Status.Stopped);
    expect(queryByText('Send to Address')).not.toBeInTheDocument();
    expect(queryByText('Launch Terminal')).not.toBeInTheDocument();
    expect(queryByText('View Logs')).not.toBeInTheDocument();
    expect(getByText('Start')).toBeInTheDocument();
    expect(getByText('Advanced Options')).toBeInTheDocument();
    expect(getByText('Remove')).toBeInTheDocument();
  });

  it('should display the correct options for a started tap node', async () => {
    const { getByText } = renderComponent('alice-tap', Status.Started);
    expect(getByText('Create Asset Address')).toBeInTheDocument();
    expect(getByText('Mint Asset')).toBeInTheDocument();
    expect(getByText('Launch Terminal')).toBeInTheDocument();
    expect(getByText('Stop')).toBeInTheDocument();
    expect(getByText('View Logs')).toBeInTheDocument();
    expect(getByText('Advanced Options')).toBeInTheDocument();
    expect(getByText('Remove')).toBeInTheDocument();
    expect(getByText('Send Asset On-chain')).toBeInTheDocument();
  });

  it('should display the correct options for a stopped tap node', async () => {
    const { getByText, queryByText } = renderComponent('alice-tap', Status.Stopped);
    expect(queryByText('Create Asset Address')).not.toBeInTheDocument();
    expect(queryByText('Mint')).not.toBeInTheDocument();
    expect(queryByText('Launch Terminal')).not.toBeInTheDocument();
    expect(queryByText('View Logs')).not.toBeInTheDocument();
    expect(getByText('Start')).toBeInTheDocument();
    expect(getByText('Advanced Options')).toBeInTheDocument();
    expect(getByText('Remove')).toBeInTheDocument();
  });

  it('should display a menu for an invalid node', async () => {
    const { queryByText } = renderComponent('invalid', Status.Started);
    expect(queryByText('Create Invoice')).not.toBeInTheDocument();
    expect(queryByText('Pay Invoice')).not.toBeInTheDocument();
    expect(queryByText('Open Outgoing Channel')).not.toBeInTheDocument();
    expect(queryByText('Open Incoming Channel')).not.toBeInTheDocument();
    expect(queryByText('Send to Address')).not.toBeInTheDocument();
    expect(queryByText('Launch Terminal')).not.toBeInTheDocument();
    expect(queryByText('Stop')).not.toBeInTheDocument();
    expect(queryByText('View Logs')).not.toBeInTheDocument();
    expect(queryByText('Advanced Options')).not.toBeInTheDocument();
    expect(queryByText('Remove')).not.toBeInTheDocument();
  });

  it('should show the create invoice modal', async () => {
    const { getByText, store } = renderComponent('alice', Status.Started);
    expect(store.getState().modals.createInvoice.visible).toBe(false);
    fireEvent.click(getByText('Create Invoice'));
    expect(store.getState().modals.createInvoice.visible).toBe(true);
  });

  it('should show the pay invoice modal', async () => {
    const { getByText, store } = renderComponent('alice', Status.Started);
    expect(store.getState().modals.payInvoice.visible).toBe(false);
    fireEvent.click(getByText('Pay Invoice'));
    expect(store.getState().modals.payInvoice.visible).toBe(true);
  });

  it('should show the open outgoing channel modal', async () => {
    const { getByText, store } = renderComponent('alice', Status.Started);
    expect(store.getState().modals.openChannel.visible).toBe(false);
    fireEvent.click(getByText('Open Outgoing Channel'));
    expect(store.getState().modals.openChannel.visible).toBe(true);
    expect(store.getState().modals.openChannel.from).toBe('alice');
  });

  it('should show the open incoming channel modal', async () => {
    const { getByText, store } = renderComponent('alice', Status.Started);
    expect(store.getState().modals.openChannel.visible).toBe(false);
    fireEvent.click(getByText('Open Incoming Channel'));
    expect(store.getState().modals.openChannel.visible).toBe(true);
    expect(store.getState().modals.openChannel.to).toBe('alice');
  });

  it('should show the open send coins modal', async () => {
    const { getByText, store } = renderComponent('backend1', Status.Started);
    expect(store.getState().modals.sendOnChain.visible).toBe(false);
    fireEvent.click(getByText('Send to Address'));
    expect(store.getState().modals.sendOnChain.visible).toBe(true);
    expect(store.getState().modals.sendOnChain.backendName).toBe('backend1');
  });

  it('should show the mint asset modal', async () => {
    const { getByText, store } = renderComponent('alice-tap', Status.Started);
    expect(store.getState().modals.mintAsset.visible).toBe(false);
    fireEvent.click(getByText('Mint Asset'));
    expect(store.getState().modals.mintAsset.visible).toBe(true);
    expect(store.getState().modals.mintAsset.nodeName).toBe('alice-tap');
  });

  it('should show the new address modal', async () => {
    const { getByText, store } = renderComponent('alice-tap', Status.Started);
    expect(store.getState().modals.newAddress.visible).toBe(false);
    fireEvent.click(getByText('Create Asset Address'));
    expect(store.getState().modals.newAddress.visible).toBe(true);
    expect(store.getState().modals.newAddress.nodeName).toBe('alice-tap');
  });

  it('should show the send asset modal', async () => {
    const { getByText, store } = renderComponent('alice-tap', Status.Started);
    expect(store.getState().modals.sendAsset.visible).toBe(false);
    fireEvent.click(getByText('Send Asset On-chain'));
    expect(store.getState().modals.sendAsset.visible).toBe(true);
    expect(store.getState().modals.sendAsset.nodeName).toBe('alice-tap');
  });

  it('should open the terminal', async () => {
    const ipcMock = injections.ipc as jest.Mock;
    ipcMock.mockResolvedValue(true);
    const { getByText, store } = renderComponent('alice', Status.Started);
    expect(store.getState().modals.openChannel.visible).toBe(false);
    await act(async () => {
      fireEvent.click(getByText('Launch Terminal'));
    });
    const url = '/terminal/LND/polar-n1-alice';
    expect(ipcMock).toBeCalledWith(ipcChannels.openWindow, { url });
  });

  it('should show the start node confirmation modal', async () => {
    const { getByText, findByText } = renderComponent('alice', Status.Stopped);
    fireEvent.click(getByText('Start'));
    expect(
      await findByText('Would you like to start the alice node?'),
    ).toBeInTheDocument();
  });

  it('should show the stop node confirmation modal', async () => {
    const { getByText, findByText } = renderComponent('alice', Status.Started);
    fireEvent.click(getByText('Stop'));
    expect(
      await findByText('Are you sure you want to stop the alice node?'),
    ).toBeInTheDocument();
  });

  it('should open log viewer', async () => {
    const ipcMock = injections.ipc as jest.Mock;
    ipcMock.mockResolvedValue(true);
    const { getByText, store } = renderComponent('alice', Status.Started);
    expect(store.getState().modals.openChannel.visible).toBe(false);
    await act(async () => {
      fireEvent.click(getByText('View Logs'));
    });
    const url = '/logs/LND/polar-n1-alice';
    expect(ipcMock).toBeCalledWith(ipcChannels.openWindow, { url });
  });

  it('should show the advanced options modal', async () => {
    const { getByText, store } = renderComponent('alice', Status.Started);
    expect(store.getState().modals.advancedOptions.visible).toBe(false);
    fireEvent.click(getByText('Advanced Options'));
    expect(store.getState().modals.advancedOptions.visible).toBe(true);
    expect(store.getState().modals.advancedOptions.nodeName).toBe('alice');
  });

  it('should show the remove node confirmation modal', async () => {
    const { getByText, findByText } = renderComponent('alice', Status.Started);
    fireEvent.click(getByText('Remove'));
    expect(
      await findByText('Are you sure you want to remove alice from the network?'),
    ).toBeInTheDocument();
  });
});
