import React from 'react';
import { fireEvent, waitForElement } from '@testing-library/dom';
import { waitForElementToBeRemoved } from '@testing-library/react';
import { Modal, notification } from 'antd';
import { BitcoindVersion, Status } from 'shared/types';
import { BitcoindLibrary, DockerLibrary } from 'types';
import { initChartFromNetwork } from 'utils/chart';
import { createBitcoindNetworkNode } from 'utils/network';
import {
  getNetwork,
  injections,
  lightningServiceMock,
  renderWithProviders,
  suppressConsoleErrors,
} from 'utils/tests';
import RemoveNode from './RemoveNode';

const dockerServiceMock = injections.dockerService as jest.Mocked<DockerLibrary>;
const bitcoindServiceMock = injections.bitcoindService as jest.Mocked<BitcoindLibrary>;

describe('RemoveNode', () => {
  const renderComponent = (status?: Status) => {
    const network = getNetwork(1, 'test network', status);
    if (status === Status.Error) {
      network.nodes.lightning.forEach(n => (n.errorMsg = 'test-error'));
    }
    network.nodes.bitcoin.push(
      createBitcoindNetworkNode(network, BitcoindVersion.latest),
    );
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
    const node = network.nodes.bitcoin[0];
    const cmp = <RemoveNode node={node} />;
    const result = renderWithProviders(cmp, { initialState });
    return {
      ...result,
      node,
    };
  };

  beforeEach(() => {
    lightningServiceMock.getChannels.mockResolvedValue([]);
    lightningServiceMock.waitUntilOnline.mockResolvedValue(Promise.resolve());
    bitcoindServiceMock.waitUntilOnline.mockResolvedValue(Promise.resolve());
  });

  afterEach(async () => {
    Modal.destroyAll();
    notification.destroy();
    // wait for the modal to be removed before starting the next test
    const getModal = () => document.querySelector('.ant-modal-root');
    if (getModal()) await waitForElementToBeRemoved(getModal);
  });

  it('should show the remove node modal', async () => {
    const { getByText } = renderComponent(Status.Started);
    expect(getByText('Remove')).toBeInTheDocument();
    fireEvent.click(getByText('Remove'));
    expect(
      getByText('Are you sure you want to remove backend1 from the network?'),
    ).toBeInTheDocument();
    expect(getByText('Yes')).toBeInTheDocument();
    expect(getByText('Cancel')).toBeInTheDocument();
  });

  it('should remove the node with the network stopped', async () => {
    const { getByText, getByLabelText } = renderComponent(Status.Stopped);
    expect(getByText('Remove')).toBeInTheDocument();
    fireEvent.click(getByText('Remove'));
    fireEvent.click(getByText('Yes'));
    // wait for the error notification to be displayed
    await waitForElement(() => getByLabelText('icon: check-circle-o'));
    expect(
      getByText('The node backend1 have been removed from the network'),
    ).toBeInTheDocument();
    expect(dockerServiceMock.saveComposeFile).toBeCalledTimes(1);
  });

  it('should remove the node with the network started', async () => {
    const { getByText, getByLabelText } = renderComponent(Status.Started);
    expect(getByText('Remove')).toBeInTheDocument();
    fireEvent.click(getByText('Remove'));
    fireEvent.click(getByText('Yes'));
    // wait for the error notification to be displayed
    await waitForElement(() => getByLabelText('icon: check-circle-o'));
    expect(
      getByText('The node backend1 have been removed from the network'),
    ).toBeInTheDocument();
    expect(dockerServiceMock.saveComposeFile).toBeCalledTimes(2);
  });

  it('should display an error if removing the node fails', async () => {
    // antd Modal.confirm logs a console error when onOk fails
    // this supresses those errors from being displayed in test runs
    await suppressConsoleErrors(async () => {
      dockerServiceMock.saveComposeFile.mockRejectedValue(new Error('test error'));
      const { getByText, getByLabelText } = renderComponent();
      expect(getByText('Remove')).toBeInTheDocument();
      fireEvent.click(getByText('Remove'));
      fireEvent.click(getByText('Yes'));
      // wait for the error notification to be displayed
      await waitForElement(() => getByLabelText('icon: close-circle-o'));
      expect(getByText('Unable to remove the node')).toBeInTheDocument();
      expect(getByText('test error')).toBeInTheDocument();
    });
  });
});
