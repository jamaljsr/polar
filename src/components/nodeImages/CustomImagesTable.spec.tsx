import React from 'react';
import { fireEvent } from '@testing-library/react';
import os from 'os';
import { CustomImage } from 'types';
import { DOCKER_REPO } from 'utils/constants';
import {
  injections,
  renderWithProviders,
  suppressConsoleErrors,
  testCustomImages,
} from 'utils/tests';
import CustomImagesTable from './CustomImagesTable';

jest.mock('os');

const mockOS = os as jest.Mocked<typeof os>;
const dockerServiceMock = injections.dockerService as jest.Mocked<
  typeof injections.dockerService
>;
const settingsServiceMock = injections.settingsService as jest.Mocked<
  typeof injections.settingsService
>;

describe('CustomImagesTable Component', () => {
  const renderComponent = (images?: CustomImage[]) => {
    const nodeImages = {
      custom: images || testCustomImages,
    };
    const initialState = {
      app: {
        settings: {
          nodeImages,
        },
      },
    };

    const result = renderWithProviders(<CustomImagesTable images={nodeImages.custom} />, {
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

  it('should display title', () => {
    const { getByText } = renderComponent();
    expect(getByText('Custom Nodes')).toBeInTheDocument();
  });

  it('should display all custom images', () => {
    const { getByText, nodeImages } = renderComponent();
    nodeImages.custom.forEach(i => {
      expect(getByText(i.name)).toBeInTheDocument();
      expect(getByText(i.dockerImage)).toBeInTheDocument();
    });
  });

  it('should not render anything if there are no custom nodes', () => {
    const { queryByText } = renderComponent([]);
    expect(queryByText('Custom Nodes')).not.toBeInTheDocument();
  });

  it('should not display incompatible custom images', () => {
    mockOS.platform.mockReturnValueOnce('win32');
    const { queryByText, nodeImages } = renderComponent();
    expect(queryByText(nodeImages.custom[1].name)).not.toBeInTheDocument();
  });

  it('should show the Custom Node Details modal', async () => {
    const { getAllByText, getByLabelText, findByText } = renderComponent();
    // click on the first Edit link
    fireEvent.click(getAllByText('Edit')[0]);
    expect(await findByText('Custom Node Details')).toBeInTheDocument();
    fireEvent.click(getByLabelText('close'));
  });

  it('should hide the Custom Node Details modal', async () => {
    const { getAllByText, getByLabelText, queryByText, findByText } = renderComponent();
    // click on the first Edit link
    fireEvent.click(getAllByText('Edit')[0]);
    expect(await findByText('Custom Node Details')).toBeInTheDocument();
    fireEvent.click(getByLabelText('close'));
    expect(queryByText('Custom Node Details')).not.toBeInTheDocument();
  });

  it('should remove a custom node', async () => {
    const {
      getByText,
      getAllByLabelText,
      findByText,
      nodeImages,
      store,
    } = renderComponent();
    const { name } = nodeImages.custom[0];
    expect(getByText(name)).toBeInTheDocument();
    // click on the first Delete icon
    fireEvent.click(getAllByLabelText('delete')[0]);
    const title = `Are you sure you want to remove the custom image '${nodeImages.custom[0].name}'?`;
    expect(await findByText(title)).toBeInTheDocument();
    fireEvent.click(getByText('Yes'));
    expect(
      await findByText(`The custom image '${name}' has been removed`),
    ).toBeInTheDocument();
    expect(store.getState().app.settings.nodeImages.custom.length).toBe(2);
  });

  it('should display an error if removing a custom node fails', async () => {
    settingsServiceMock.save.mockRejectedValue(new Error('test-error'));
    await suppressConsoleErrors(async () => {
      const { getByText, getAllByLabelText, findByText, nodeImages } = renderComponent();
      const { name } = nodeImages.custom[0];
      expect(getByText(name)).toBeInTheDocument();
      // click on the first Delete icon
      fireEvent.click(getAllByLabelText('delete')[0]);
      const title = `Are you sure you want to remove the custom image '${nodeImages.custom[0].name}'?`;
      expect(await findByText(title)).toBeInTheDocument();
      fireEvent.click(getByText('Yes'));
      expect(await findByText('Unable to remove the custom node')).toBeInTheDocument();
      expect(await findByText('test-error')).toBeInTheDocument();
    });
  });
});
