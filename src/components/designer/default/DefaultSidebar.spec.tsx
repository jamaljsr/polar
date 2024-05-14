import React from 'react';
import { REACT_FLOW_CHART } from '@mrblenny/react-flow-chart';
import { createEvent, fireEvent } from '@testing-library/dom';
import os from 'os';
import { Status } from 'shared/types';
import { CustomImage } from 'types';
import { initChartFromNetwork } from 'utils/chart';
import { defaultRepoState } from 'utils/constants';
import { getNetwork, injections, renderWithProviders } from 'utils/tests';
import DefaultSidebar from './DefaultSidebar';

jest.mock('os', () => {
  const actualOS = jest.requireActual('os');
  return {
    ...actualOS,
    platform: jest.fn().mockReturnValue('darwin'),
  };
});

const mockOS = os as jest.Mocked<typeof os>;

const mockRepoService = injections.repoService as jest.Mocked<
  typeof injections.repoService
>;

describe('DefaultSidebar Component', () => {
  const lndLatest = defaultRepoState.images.LND.latest;
  const customImages: CustomImage[] = [
    {
      id: '123',
      name: 'My Test Image',
      implementation: 'c-lightning',
      dockerImage: 'custom:image',
      command: 'test-command',
    },
  ];

  const renderComponent = (status?: Status, images?: CustomImage[]) => {
    const network = getNetwork(1, 'test network', status);
    const chart = initChartFromNetwork(network);
    const initialState = {
      app: {
        dockerRepoState: defaultRepoState,
        settings: {
          nodeImages: {
            custom: images || [],
          },
        },
      },
      network: {
        networks: [network],
      },
      designer: {
        activeId: network.id,
        allCharts: {
          [network.id]: chart,
        },
      },
    };

    const result = renderWithProviders(<DefaultSidebar />, {
      initialState,
    });
    return {
      ...result,
      network,
    };
  };

  beforeEach(() => {
    mockOS.platform.mockReturnValue('darwin');
  });

  it('should expand the list of LND nodes', async () => {
    const { getByText, getAllByLabelText } = renderComponent();
    expect(getByText(`LND v${lndLatest}`)).toBeInTheDocument();
    const prevVersion = defaultRepoState.images.LND.versions[2];
    expect(getByText(`LND v${prevVersion}`)).not.toBeVisible();
    fireEvent.click(getAllByLabelText('down')[0]);
    expect(getByText(`LND v${prevVersion}`)).toBeVisible();
    fireEvent.click(getAllByLabelText('up')[0]);
    expect(getByText(`LND v${prevVersion}`)).not.toBeVisible();
  });

  it('should display the Image Updates Modal', async () => {
    mockRepoService.checkForUpdates.mockResolvedValue({
      state: defaultRepoState,
    });
    const { getByText, store } = renderComponent();
    expect(getByText('Check for new Node Versions')).toBeInTheDocument();
    fireEvent.click(getByText('Check for new Node Versions'));
    expect(store.getState().modals.imageUpdates.visible).toBe(true);
  });

  it('should not display c-lightning nodes on Windows', () => {
    mockOS.platform.mockReturnValue('win32');
    const { queryByText } = renderComponent();
    expect(queryByText('c-lightning')).not.toBeInTheDocument();
  });

  it('should display custom images', () => {
    const { getByText } = renderComponent(Status.Stopped, customImages);
    expect(getByText(`My Test Image`)).toBeInTheDocument();
  });

  it('should not display incompatible custom images', () => {
    mockOS.platform.mockReturnValue('win32');
    const { queryByText } = renderComponent(Status.Stopped, customImages);
    expect(queryByText(`My Test Image`)).not.toBeInTheDocument();
  });

  it('should display a draggable LND node', () => {
    const { getByText } = renderComponent();
    expect(getByText(`LND v${lndLatest}`)).toBeInTheDocument();
  });

  it('should allow dragging a node', async () => {
    const { getByText } = renderComponent();
    const lnd = getByText(`LND v${lndLatest}`);
    const setData = jest.fn();
    const dragEvent = createEvent.dragStart(lnd);
    Object.defineProperty(dragEvent, 'dataTransfer', { value: { setData } });
    fireEvent(lnd, dragEvent);
    expect(setData).toBeCalledWith(
      REACT_FLOW_CHART,
      JSON.stringify({ type: 'LND', version: lndLatest }),
    );
  });
});
