import React from 'react';
import { fireEvent, waitForElementToBeRemoved } from '@testing-library/react';
import os from 'os';
import { defaultRepoState, DOCKER_REPO } from 'utils/constants';
import {
  injections,
  renderWithProviders,
  testCustomImages,
  testManagedImages,
} from 'utils/tests';
import NodeImagesView from './NodeImagesView';

jest.mock('os');

const mockOS = os as jest.Mocked<typeof os>;
const dockerServiceMock = injections.dockerService as jest.Mocked<
  typeof injections.dockerService
>;

describe('NodeImagesView Component', () => {
  const renderComponent = () => {
    const nodeImages = {
      managed: testManagedImages,
      custom: testCustomImages,
    };
    const initialState = {
      app: {
        settings: {
          nodeImages,
        },
      },
    };

    const result = renderWithProviders(<NodeImagesView />, {
      initialState,
    });
    return {
      ...result,
      nodeImages,
    };
  };

  beforeEach(() => {
    mockOS.platform.mockReturnValue('darwin');
    dockerServiceMock.getImages.mockResolvedValue(['aaa', 'bbb', `${DOCKER_REPO}/lnd`]);
  });

  it('should display titles', () => {
    const { getByText } = renderComponent();
    expect(getByText('Customize Node Docker Images')).toBeInTheDocument();
    expect(getByText('Custom Nodes')).toBeInTheDocument();
    expect(getByText('Nodes Managed by Polar')).toBeInTheDocument();
  });

  it('should display all managed images', () => {
    const { getAllByText } = renderComponent();
    expect(getAllByText('polarlightning/lnd')).toHaveLength(
      defaultRepoState.images.LND.versions.length,
    );
    expect(getAllByText('polarlightning/clightning')).toHaveLength(
      defaultRepoState.images['c-lightning'].versions.length,
    );
    expect(getAllByText('polarlightning/bitcoind')).toHaveLength(
      defaultRepoState.images.bitcoind.versions.length,
    );
  });

  it('should display custom images', () => {
    const { getByText, nodeImages } = renderComponent();
    const custom = nodeImages.custom[0];
    expect(getByText(custom.name)).toBeInTheDocument();
    expect(getByText(custom.dockerImage)).toBeInTheDocument();
  });

  it('should navigate home when back button clicked', () => {
    const { getByLabelText, history } = renderComponent();
    const backBtn = getByLabelText('Back');
    expect(backBtn).toBeInTheDocument();
    fireEvent.click(backBtn);
    expect(history.location.pathname).toEqual('/');
  });

  it('should open the Add Custom Image modal', async () => {
    const { getByText, findByText } = renderComponent();
    fireEvent.click(getByText('Add a Custom Node'));
    expect(await findByText('Custom Node Details')).toBeInTheDocument();
  });

  it('should close the Add Custom Image modal', async () => {
    const { getByText, getByLabelText, queryByText, findByText } = renderComponent();
    fireEvent.click(getByText('Add a Custom Node'));
    expect(await findByText('Custom Node Details')).toBeInTheDocument();
    fireEvent.click(getByLabelText('close'));
    expect(queryByText('Custom Node Details')).not.toBeInTheDocument();
  });

  it('should add a new Custom Image', async () => {
    const { getByText, getByLabelText, findByText, store } = renderComponent();
    expect(store.getState().app.settings.nodeImages.custom).toHaveLength(2);
    fireEvent.click(getByText('Add a Custom Node'));
    expect(await findByText('Custom Node Details')).toBeInTheDocument();
    fireEvent.change(getByLabelText('Name'), { target: { value: 'My Image' } });
    fireEvent.change(getByLabelText('Docker Image'), { target: { value: 'test-image' } });
    fireEvent.click(getByText('Save'));
    await waitForElementToBeRemoved(() => getByText('Custom Node Details'));
    expect(store.getState().app.settings.nodeImages.custom).toHaveLength(3);
    // confirm the new image was added at the start of the list
    expect(store.getState().app.settings.nodeImages.custom[0].name).toBe('My Image');
  });
});
