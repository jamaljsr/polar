import React from 'react';
import { fireEvent, waitForElement } from '@testing-library/dom';
import { Status } from 'shared/types';
import { DockerLibrary, LndLibrary } from 'types';
import { initChartFromNetwork } from 'utils/chart';
import { groupNodes } from 'utils/network';
import {
  getNetwork,
  injections,
  lightningServiceMock,
  renderWithProviders,
  suppressConsoleErrors,
} from 'utils/tests';
import RemoveNode from './RemoveNode';

const lndServiceMock = injections.lndService as jest.Mocked<LndLibrary>;
const dockerServiceMock = injections.dockerService as jest.Mocked<DockerLibrary>;

describe('RemoveNode', () => {
  const renderComponent = (status?: Status) => {
    const network = getNetwork(1, 'test network', status);
    if (status === Status.Error) {
      network.nodes.lightning.forEach(n => (n.errorMsg = 'test-error'));
    }
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
    const { lnd } = groupNodes(network);
    const node = lnd[status === Status.Started ? 0 : 1];
    const cmp = <RemoveNode node={node} />;
    const result = renderWithProviders(cmp, { initialState });
    return {
      ...result,
      node,
    };
  };

  beforeEach(() => {
    lightningServiceMock.getChannels.mockResolvedValue([]);
  });

  it('should show the remove node modal', async () => {
    const { getByText } = renderComponent(Status.Started);
    expect(getByText('Remove')).toBeInTheDocument();
    fireEvent.click(getByText('Remove'));
    expect(
      getByText('Are you sure you want to remove alice from the network?'),
    ).toBeInTheDocument();
    expect(getByText('Yes')).toBeInTheDocument();
    expect(getByText('Cancel')).toBeInTheDocument();
  });

  it('should remove the node with the network stopped', async () => {
    const { getByText, getAllByText, getByLabelText } = renderComponent(Status.Stopped);
    expect(getByText('Remove')).toBeInTheDocument();
    fireEvent.click(getByText('Remove'));
    // antd creates two modals in the DOM for some silly reason. Need to click one
    fireEvent.click(getAllByText('Yes')[0]);
    // wait for the error notification to be displayed
    await waitForElement(() => getByLabelText('icon: check-circle-o'));
    expect(
      getByText('The node alice have been removed from the network'),
    ).toBeInTheDocument();
    expect(lndServiceMock.onNodesDeleted).toBeCalledTimes(1);
    expect(dockerServiceMock.removeNode).toBeCalledTimes(1);
  });

  it('should remove the node with the network started', async () => {
    const { getByText, getAllByText, getByLabelText } = renderComponent(Status.Started);
    expect(getByText('Remove')).toBeInTheDocument();
    fireEvent.click(getByText('Remove'));
    // antd creates two modals in the DOM for some silly reason. Need to click one
    fireEvent.click(getAllByText('Yes')[0]);
    // wait for the error notification to be displayed
    await waitForElement(() => getByLabelText('icon: check-circle-o'));
    expect(
      getByText('The node alice have been removed from the network'),
    ).toBeInTheDocument();
    expect(lndServiceMock.onNodesDeleted).toBeCalledTimes(1);
    expect(dockerServiceMock.removeNode).toBeCalledTimes(1);
  });

  it('should display an error if removing the node fails', async () => {
    // antd Modal.confirm logs a console error when onOk fails
    // this supresses those errors from being displayed in test runs
    await suppressConsoleErrors(async () => {
      dockerServiceMock.removeNode.mockRejectedValue(new Error('test error'));
      const { getByText, getAllByText, getByLabelText } = renderComponent();
      expect(getByText('Remove')).toBeInTheDocument();
      fireEvent.click(getByText('Remove'));
      // antd creates two modals in the DOM for some silly reason. Need to click one
      fireEvent.click(getAllByText('Yes')[0]);
      // wait for the error notification to be displayed
      await waitForElement(() => getByLabelText('icon: close-circle-o'));
      expect(getByText('Unable to remove the node')).toBeInTheDocument();
      expect(getByText('test error')).toBeInTheDocument();
    });
  });
});
