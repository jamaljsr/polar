import React from 'react';
import { fireEvent } from '@testing-library/react';
import os from 'os';
import { ManagedImage } from 'types';
import { DOCKER_REPO } from 'utils/constants';
import { injections, renderWithProviders, testManagedImages } from 'utils/tests';
import ManagedImagesTable from './ManagedImagesTable';

jest.mock('os');

const mockOS = os as jest.Mocked<typeof os>;
const dockerServiceMock = injections.dockerService as jest.Mocked<
  typeof injections.dockerService
>;

describe('ManagedImagesTable Component', () => {
  const renderComponent = () => {
    const nodeImages = {
      managed: [
        ...testManagedImages,
        // add a dummy image
        { implementation: 'eclair', version: 'test', command: 'test-lnd-command' },
      ] as ManagedImage[],
    };
    const initialState = {
      app: {
        settings: {
          nodeImages,
        },
      },
    };

    const result = renderWithProviders(
      <ManagedImagesTable images={nodeImages.managed} />,
      { initialState },
    );
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
    expect(getByText('Nodes Managed by Polar')).toBeInTheDocument();
  });

  it('should display all managed images', () => {
    const { getAllByText } = renderComponent();
    // 1 is the number of each implementation in testManagedImages
    expect(getAllByText('polarlightning/lnd')).toHaveLength(1);
    expect(getAllByText('polarlightning/clightning')).toHaveLength(1);
    expect(getAllByText('polarlightning/bitcoind')).toHaveLength(1);
  });

  it('should display the custom command', () => {
    const { getByText } = renderComponent();
    expect(getByText('test-lnd-command')).toBeInTheDocument();
  });

  it('should not display incompatible managed images', () => {
    mockOS.platform.mockReturnValueOnce('win32');
    const { queryAllByText } = renderComponent();
    // 1 is the number of each implementation in testManagedImages
    expect(queryAllByText('polarlightning/lnd')).toHaveLength(1);
    expect(queryAllByText('polarlightning/clightning')).toHaveLength(0);
    expect(queryAllByText('polarlightning/bitcoind')).toHaveLength(1);
  });

  it('should show the Customize Managed Node modal', async () => {
    const { getAllByText, findByText } = renderComponent();
    // click on the first Edit link
    fireEvent.click(getAllByText('Edit')[0]);
    expect(await findByText(/Customize Managed Node - */)).toBeInTheDocument();
  });

  it('should hide the Customize Managed Node modal', async () => {
    const { getAllByText, getByLabelText, queryByText, findByText } = renderComponent();
    // click on the first Edit link
    fireEvent.click(getAllByText('Edit')[0]);
    expect(await findByText(/Customize Managed Node - */)).toBeInTheDocument();
    fireEvent.click(getByLabelText('close'));
    expect(queryByText(/Customize Managed Node - */)).not.toBeInTheDocument();
  });
});
