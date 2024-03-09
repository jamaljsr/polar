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
import RestartNode from './RestartNode';

const dockerServiceMock = injections.dockerService as jest.Mocked<DockerLibrary>;

describe('RestartNode', () => {
  const renderComponent = (status?: Status) => {
    const network = getNetwork(1, 'test network', status?.toString());
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
    const cmp = <RestartNode node={node} />;
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
    expect(getByText('Restart Node')).toBeInTheDocument();
    expect(getByText('Start')).toBeInTheDocument();
    expect(getByText('Stop')).toBeInTheDocument();
  });

  it('should have Stop button disabled when the node is stopped', () => {
    const { getByText } = renderComponent();
    expect(getByText('Stop').parentNode).toHaveAttribute('disabled');
  });

  it('should have Start button disabled when the node is started', () => {
    const { getByText } = renderComponent(Status.Started);
    expect(getByText('Start').parentNode).toHaveAttribute('disabled');
  });

  it('should show the start node modal', async () => {
    const { getByText, findByText } = renderComponent();
    expect(getByText('Start')).toBeInTheDocument();
    fireEvent.click(getByText('Start'));
    expect(
      await findByText('Would you like to start the alice node?'),
    ).toBeInTheDocument();
    expect(getByText('Yes')).toBeInTheDocument();
    expect(getByText('Cancel')).toBeInTheDocument();
  });

  it('should show the stop node modal', async () => {
    const { getByText, findByText } = renderComponent(Status.Started);
    expect(getByText('Stop')).toBeInTheDocument();
    fireEvent.click(getByText('Stop'));
    expect(
      await findByText('Are you sure you want to stop the alice node?'),
    ).toBeInTheDocument();
    expect(getByText('Yes')).toBeInTheDocument();
    expect(getByText('Cancel')).toBeInTheDocument();
  });

  it('should start the node when stopped', async () => {
    const { getByText, findByText, getByLabelText } = renderComponent();
    expect(getByText('Start')).toBeInTheDocument();
    fireEvent.click(getByText('Start'));
    fireEvent.click(await findByText('Yes'));
    // wait for the error notification to be displayed
    await waitFor(() => getByLabelText('check-circle'));
    expect(getByText('The node alice has been started')).toBeInTheDocument();
    expect(dockerServiceMock.startNode).toBeCalledTimes(1);
  });

  it('should stop the node when started', async () => {
    const { getByText, findByText, getByLabelText } = renderComponent(Status.Started);
    expect(getByText('Stop')).toBeInTheDocument();
    fireEvent.click(getByText('Stop'));
    fireEvent.click(await findByText('Yes'));
    // wait for the error notification to be displayed
    await waitFor(() => getByLabelText('check-circle'));
    expect(getByText('The node alice has been stopped')).toBeInTheDocument();
    expect(dockerServiceMock.stopNode).toBeCalledTimes(1);
  });

  it('should display an error if starting the node fails', async () => {
    // antd Modal.confirm logs a console error when onOk fails
    // this suppresses those errors from being displayed in test runs
    await suppressConsoleErrors(async () => {
      dockerServiceMock.startNode.mockRejectedValue(new Error('start-error'));
      const { getByText, findByText, getByLabelText } = renderComponent();
      expect(getByText('Start')).toBeInTheDocument();
      fireEvent.click(getByText('Start'));
      fireEvent.click(await findByText('Yes'));
      // wait for the error notification to be displayed
      await waitFor(() => getByLabelText('close'));
      expect(getByText('Unable to start the node')).toBeInTheDocument();
      expect(getByText('start-error')).toBeInTheDocument();
    });
  });

  it('should display an error if stopping the node fails', async () => {
    // antd Modal.confirm logs a console error when onOk fails
    // this suppresses those errors from being displayed in test runs
    await suppressConsoleErrors(async () => {
      dockerServiceMock.stopNode.mockRejectedValue(new Error('stop-error'));
      const { getByText, findByText, getByLabelText } = renderComponent(Status.Started);
      expect(getByText('Stop')).toBeInTheDocument();
      fireEvent.click(getByText('Stop'));
      fireEvent.click(await findByText('Yes'));
      // wait for the error notification to be displayed
      await waitFor(() => getByLabelText('close'));
      expect(getByText('Unable to stop the node')).toBeInTheDocument();
      expect(getByText('stop-error')).toBeInTheDocument();
    });
  });
});
