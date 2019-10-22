import React from 'react';
import { fireEvent, wait } from '@testing-library/dom';
import { createMemoryHistory } from 'history';
import { Status } from 'types';
import { initChartFromNetwork } from 'utils/chart';
import { getNetwork, injections, renderWithProviders } from 'utils/tests';
import NetworkView from './NetworkView';

const lndServiceMock = injections.lndService as jest.Mocked<typeof injections.lndService>;
const bitcoindServiceMock = injections.bitcoindService as jest.Mocked<
  typeof injections.bitcoindService
>;

describe('NetworkView Component', () => {
  const renderComponent = (id: string | undefined, status?: Status) => {
    const network = getNetwork(1, 'test network', status);
    const initialState = {
      network: {
        networks: [network],
      },
      designer: {
        allCharts: {
          1: initChartFromNetwork(network),
        },
      },
    };
    const route = `/network/${id}`;
    const history = createMemoryHistory({ initialEntries: [route] });
    const location = { pathname: route, search: '', hash: '', state: undefined };
    const match = { params: { id }, isExact: true, path: '', url: route };
    const cmp = <NetworkView history={history} location={location} match={match} />;
    const result = renderWithProviders(cmp, { initialState, route });
    return {
      ...result,
      primaryBtn: result.container.querySelector(
        '.ant-page-header-heading-extra .ant-btn',
      ) as Element,
    };
  };

  beforeEach(() => {
    lndServiceMock.waitUntilOnline.mockResolvedValue(true);
    bitcoindServiceMock.waitUntilOnline.mockResolvedValue(true);
  });

  it('should not render if the network is not found', () => {
    const { queryByText } = renderComponent('99');
    expect(queryByText('test network')).toBeNull();
  });

  it('should not render if the network id is not provided', () => {
    const { queryByText } = renderComponent(undefined);
    expect(queryByText('test network')).toBeNull();
  });

  it('should render the name', () => {
    const { getByText } = renderComponent('1');
    expect(getByText('test network')).toBeInTheDocument();
  });

  it('should navigate home when back button clicked', () => {
    const { getByLabelText, history } = renderComponent('1');
    const backBtn = getByLabelText('Back');
    expect(backBtn).toBeInTheDocument();
    fireEvent.click(backBtn);
    expect(history.location.pathname).toEqual('/');
  });

  it('should render an error if necessary', async () => {
    const errorMsg = 'failed to start';
    // mock dockerService.start to throw an error
    const mockDockerStart = injections.dockerService.start as jest.Mock;
    mockDockerStart.mockRejectedValueOnce(new Error(errorMsg));
    const { getByText, findByText } = renderComponent('1');
    fireEvent.click(getByText('Start'));
    expect(await findByText(errorMsg)).toBeInTheDocument();
  });

  it('should change UI when network is started', async () => {
    const { primaryBtn } = renderComponent('1');
    expect(primaryBtn).toHaveTextContent('Start');
    fireEvent.click(primaryBtn);
    // should switch to stopping immediately
    expect(primaryBtn).toHaveTextContent('Starting');
    // should change to stopped after some time
    await wait(() => {
      expect(primaryBtn).toHaveTextContent('Stop');
    });
  });

  it('should change UI when network is stopped', async () => {
    const { primaryBtn } = renderComponent('1', Status.Started);
    expect(primaryBtn).toHaveTextContent('Stop');
    fireEvent.click(primaryBtn);
    // should switch to stopping immediately
    expect(primaryBtn).toHaveTextContent('Stopping');
    // should change to stopped after some time
    await wait(() => {
      expect(primaryBtn).toHaveTextContent('Start');
    });
  });

  it('should do nothing when network is starting', async () => {
    const { primaryBtn } = renderComponent('1', Status.Starting);
    expect(primaryBtn).toHaveTextContent('Starting');
    fireEvent.click(primaryBtn);
    // should remain the same since button should be disabled
    expect(primaryBtn).toHaveTextContent('Starting');
  });

  describe('rename network', () => {
    beforeEach(jest.useFakeTimers);
    afterEach(jest.useRealTimers);

    it('should show the rename input', async () => {
      const { getByLabelText, getByText, findByDisplayValue } = renderComponent('1');
      fireEvent.mouseOver(getByLabelText('icon: more'));
      await wait(() => jest.runOnlyPendingTimers());
      fireEvent.click(getByText('Rename'));
      const input = (await findByDisplayValue('test network')) as HTMLInputElement;
      expect(input).toBeInTheDocument();
      expect(input.type).toBe('text');
      fireEvent.click(getByText('Cancel'));
      expect(input).not.toBeInTheDocument();
      expect(getByText('Start')).toBeInTheDocument();
    });

    it('should rename the network', async () => {
      const { getByLabelText, getByText, findByDisplayValue, store } = renderComponent(
        '1',
      );
      fireEvent.mouseOver(getByLabelText('icon: more'));
      await wait(() => jest.runOnlyPendingTimers());
      fireEvent.click(getByText('Rename'));
      const input = await findByDisplayValue('test network');
      fireEvent.change(input, { target: { value: 'new network name' } });
      fireEvent.click(getByText('Save'));
      await wait(() => {
        expect(store.getState().network.networkById(1).name).toBe('new network name');
      });
    });

    it('should display an error if renaming fails', async () => {
      const { getByLabelText, getByText, findByDisplayValue, store } = renderComponent(
        '1',
      );
      fireEvent.mouseOver(getByLabelText('icon: more'));
      await wait(() => jest.runOnlyPendingTimers());
      fireEvent.click(getByText('Rename'));
      const input = await findByDisplayValue('test network');
      fireEvent.change(input, { target: { value: '' } });
      fireEvent.click(getByText('Save'));
      await wait(() => {
        expect(getByText('Failed to rename the network')).toBeInTheDocument();
      });
    });
  });
});
