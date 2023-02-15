import React from 'react';
import { ILink } from '@mrblenny/react-flow-chart';
import { fireEvent } from '@testing-library/dom';
import { Status } from 'shared/types';
import { initChartFromNetwork } from 'utils/chart';
import {
  defaultTaroAsset,
  getNetwork,
  renderWithProviders,
  taroServiceMock,
} from 'utils/tests';
import LinkContextMenu from './LinkContextMenu';

describe('LinkContextMenu', () => {
  const createChannelLink = (): ILink => ({
    id: 'alice-carol',
    from: { nodeId: 'alice', portId: 'alice-carol' },
    to: { nodeId: 'carol', portId: 'alice-carol' },
    properties: {
      type: 'open-channel',
      capacity: '1000',
      fromBalance: '600',
      toBalance: '400',
      direction: 'ltr',
      status: 'Open',
      isPrivate: false,
    },
  });
  const createBackendLink = (): ILink => ({
    id: 'alice-backend1',
    from: { nodeId: 'alice', portId: 'alice-backend1' },
    to: { nodeId: 'backend1', portId: 'alice-backend1' },
    properties: {
      type: 'backend',
    },
  });
  const createTaroBackendLink = (): ILink => ({
    id: 'alice-taro-alice',
    from: { nodeId: 'alice-taro', portId: 'lndbackend' },
    to: { nodeId: 'alice', portId: 'lndbackend' },
    properties: {
      type: 'lndbackend',
    },
  });
  const renderComponent = (link: ILink, activeId?: number) => {
    const network = getNetwork(1, 'test network', Status.Started, 2);
    const chart = initChartFromNetwork(network);
    chart.links[link.id] = link;
    const initialState = {
      network: {
        networks: [network],
      },
      taro: {
        nodes: {
          'alice-taro': {
            assets: [],
            balances: [],
          },
        },
      },
      designer: {
        activeId: activeId || network.id,
        allCharts: {
          [network.id]: chart,
        },
      },
    };
    const cmp = (
      <LinkContextMenu link={link}>
        <span>test-child</span>
      </LinkContextMenu>
    );
    const result = renderWithProviders(cmp, { initialState });
    // always open the context menu for all tests
    fireEvent.contextMenu(result.getByText('test-child'));
    return { ...result, network };
  };

  it('should not render menu with no network', () => {
    const { queryByText } = renderComponent(createChannelLink(), -1);
    expect(queryByText('Close Channel')).not.toBeInTheDocument();
  });

  it('should display the correct options for an open channel', async () => {
    const { getByText } = renderComponent(createChannelLink());
    expect(getByText('Close Channel')).toBeInTheDocument();
  });

  it('should display the correct options for a backend connection', async () => {
    const { getByText } = renderComponent(createBackendLink());
    expect(getByText('Change Backend')).toBeInTheDocument();
  });
  it('should display the correct options for a backend connection', async () => {
    const { getByText } = renderComponent(createTaroBackendLink());
    expect(getByText('Change Backend')).toBeInTheDocument();
  });
  it('should display a disabled option backend taro connection', async () => {
    taroServiceMock.listAssets.mockResolvedValue([defaultTaroAsset({})]);
    const { getByText, store, network } = renderComponent(createTaroBackendLink());
    store.getActions().taro.getAssets(network.nodes.taro[0]);
    expect(getByText('Change Backend')).toBeInTheDocument();
  });

  it('should not display a menu for an invalid link', async () => {
    const { queryByText } = renderComponent({} as ILink);
    expect(queryByText('Close Channel')).not.toBeInTheDocument();
    expect(queryByText('Change Backend')).not.toBeInTheDocument();
  });

  it('should not display Close Channel an invalid node', async () => {
    const link = createChannelLink();
    link.from.nodeId = 'invalid';
    const { queryByText } = renderComponent(link);
    expect(queryByText('Close Channel')).not.toBeInTheDocument();
  });
});
