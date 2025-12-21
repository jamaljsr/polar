import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react';
import { Status } from 'shared/types';
import { DockerLibrary } from 'types';
import { initChartFromNetwork } from 'utils/chart';
import {
  getNetwork,
  injections,
  lightningServiceMock,
  renderWithProviders,
  suppressConsoleErrors,
} from 'utils/tests';
import TorButton from './TorButton';

const dockerServiceMock = injections.dockerService as jest.Mocked<DockerLibrary>;

describe('TorButton', () => {
  const renderComponent = (
    status?: Status,
    enableTor = false,
    menuType?: 'enable' | 'disable',
  ) => {
    const network = getNetwork(1, 'test network', status);
    const initialState = {
      network: {
        networks: [network],
      },
      designer: {
        allCharts: {
          1: initChartFromNetwork(network),
        },
        activeId: 1,
      },
    };
    const { lightning } = network.nodes;
    const node = lightning[0];
    node.enableTor = enableTor;
    const cmp = <TorButton node={node} menuType={menuType} />;
    const result = renderWithProviders(cmp, { initialState, wrapForm: true });
    return {
      ...result,
      node,
    };
  };

  beforeEach(() => {
    lightningServiceMock.waitUntilOnline.mockResolvedValue();
  });

  it('should display the UI elements', () => {
    const { getByText } = renderComponent();
    expect(getByText('Tor')).toBeInTheDocument();
    expect(getByText('Enable Tor')).toBeInTheDocument();
    expect(getByText('Disable Tor')).toBeInTheDocument();
  });

  it('should have Enable button disabled when Tor is already enabled', () => {
    const { getByText } = renderComponent(Status.Stopped, true);
    expect(getByText('Enable Tor').parentElement).toHaveAttribute('disabled');
  });

  it('should have Disable button disabled when Tor is disabled', () => {
    const { getByText } = renderComponent(Status.Stopped, false);
    expect(getByText('Disable Tor').parentElement).toHaveAttribute('disabled');
  });

  it('should show the enable Tor modal for stopped node', async () => {
    const { getByText, findByText } = renderComponent(Status.Stopped, false);
    fireEvent.click(getByText('Enable Tor'));
    expect(
      await findByText('Would you like to enable Tor for the alice node?'),
    ).toBeInTheDocument();
    expect(getByText('Yes')).toBeInTheDocument();
    expect(getByText('Cancel')).toBeInTheDocument();
  });

  it('should show the disable Tor modal for stopped node', async () => {
    const { getByText, findByText } = renderComponent(Status.Stopped, true);
    fireEvent.click(getByText('Disable Tor'));
    expect(
      await findByText('Are you sure you want to disable Tor for the alice node?'),
    ).toBeInTheDocument();
    expect(getByText('Yes')).toBeInTheDocument();
    expect(getByText('Cancel')).toBeInTheDocument();
  });

  it('should show warning alert when enabling Tor on started node', async () => {
    const { getByText, findByText } = renderComponent(Status.Started, false);
    fireEvent.click(getByText('Enable Tor'));
    expect(
      await findByText('Would you like to enable Tor for the alice node?'),
    ).toBeInTheDocument();
    expect(
      getByText('This node will be restarted to perform this operation'),
    ).toBeInTheDocument();
    const confirmBtn = getByText('Yes');
    expect(confirmBtn.parentElement).toHaveClass('ant-btn-dangerous');
  });

  it('should show warning alert when disabling Tor on started node', async () => {
    const { getByText, findByText } = renderComponent(Status.Started, true);
    fireEvent.click(getByText('Disable Tor'));
    expect(
      await findByText('Are you sure you want to disable Tor for the alice node?'),
    ).toBeInTheDocument();
    expect(
      getByText('This node will be restarted to perform this operation'),
    ).toBeInTheDocument();
  });

  it('should enable Tor when stopped', async () => {
    const { getByText, findByText, getByLabelText } = renderComponent(
      Status.Stopped,
      false,
    );
    fireEvent.click(getByText('Enable Tor'));
    fireEvent.click(await findByText('Yes'));
    await waitFor(() => getByLabelText('check-circle'));
    expect(getByText('Tor has been enabled for the node alice')).toBeInTheDocument();
    expect(dockerServiceMock.saveComposeFile).toBeCalledTimes(1);
  });

  it('should enable Tor when started', async () => {
    const { getByText, findByText, getByLabelText } = renderComponent(
      Status.Started,
      false,
    );
    fireEvent.click(getByText('Enable Tor'));
    fireEvent.click(await findByText('Yes'));
    await waitFor(() => getByLabelText('check-circle'));
    expect(getByText('Tor has been enabled for the node alice')).toBeInTheDocument();
    expect(dockerServiceMock.saveComposeFile).toHaveBeenCalled();
  });

  it('should display an error if enabling Tor fails', async () => {
    await suppressConsoleErrors(async () => {
      dockerServiceMock.saveComposeFile.mockRejectedValue(new Error('enable-error'));
      const { getByText, findByText, getByLabelText } = renderComponent(
        Status.Stopped,
        false,
      );
      fireEvent.click(getByText('Enable Tor'));
      fireEvent.click(await findByText('Yes'));
      await waitFor(() => getByLabelText('close'));
      expect(getByText('Failed to enable Tor for this node')).toBeInTheDocument();
      expect(getByText('enable-error')).toBeInTheDocument();
    });
  });

  it('should display an error if disabling Tor fails', async () => {
    await suppressConsoleErrors(async () => {
      dockerServiceMock.saveComposeFile.mockRejectedValue(new Error('disable-error'));
      const { getByText, findByText, getByLabelText } = renderComponent(
        Status.Stopped,
        true,
      );
      fireEvent.click(getByText('Disable Tor'));
      fireEvent.click(await findByText('Yes'));
      await waitFor(() => getByLabelText('close'));
      expect(getByText('Failed to disable Tor for this node')).toBeInTheDocument();
      expect(getByText('disable-error')).toBeInTheDocument();
    });
  });

  it('should show enable modal when menu item is clicked', async () => {
    const { getByText, findByText } = renderComponent(Status.Stopped, false, 'enable');
    fireEvent.click(getByText('Enable Tor'));
    expect(
      await findByText('Would you like to enable Tor for the alice node?'),
    ).toBeInTheDocument();
  });

  it('should show disable modal when menu item is clicked', async () => {
    const { getByText, findByText } = renderComponent(Status.Stopped, true, 'disable');
    fireEvent.click(getByText('Disable Tor'));
    expect(
      await findByText('Are you sure you want to disable Tor for the alice node?'),
    ).toBeInTheDocument();
  });

  it('should show not supported message for non-lightning/bitcoin node types', () => {
    const network = getNetwork(1, 'test network');
    const tapNode = {
      ...network.nodes.lightning[0],
      type: 'tap',
      enableTor: true,
    } as any;

    const initialState = {
      network: { networks: [network] },
      designer: {
        allCharts: { 1: initChartFromNetwork(network) },
        activeId: 1,
      },
    };

    const { getByText } = renderWithProviders(<TorButton node={tapNode} />, {
      initialState,
      wrapForm: true,
    });

    expect(getByText('Tor Not Currently Supported')).toBeInTheDocument();
  });
});
