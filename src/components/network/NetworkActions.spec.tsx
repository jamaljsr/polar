import React from 'react';
import { fireEvent, wait } from '@testing-library/dom';
import { Status } from 'shared/types';
import { getNetwork, injections, renderWithProviders } from 'utils/tests';
import NetworkActions from './NetworkActions';

describe('NetworkActions Component', () => {
  const handleClick = jest.fn();
  const handleRenameClick = jest.fn();
  const handleDeleteClick = jest.fn();
  const handleExportClick = jest.fn();

  const renderComponent = (status: Status) => {
    const network = getNetwork(1, 'test network', status);
    network.nodes.bitcoin.forEach(n => (n.status = status));
    const initialState = {
      network: {
        networks: [network],
      },
      bitcoind: {
        nodes: {
          backend1: {
            chainInfo: {
              blocks: 10,
            },
          },
        },
      },
    };
    return renderWithProviders(
      <NetworkActions
        network={network}
        onClick={handleClick}
        onRenameClick={handleRenameClick}
        onDeleteClick={handleDeleteClick}
        onExportClick={handleExportClick}
      />,
      { initialState },
    );
  };

  beforeEach(jest.useFakeTimers);
  afterEach(jest.useRealTimers);

  it('should render the Starting status', () => {
    const { getByText } = renderComponent(Status.Starting);
    const primaryBtn = getByText('Starting');
    expect(primaryBtn).toBeInTheDocument();
    expect(primaryBtn.parentElement).toHaveClass('ant-btn-loading');
  });

  it('should render the Started status', () => {
    const { getByText } = renderComponent(Status.Started);
    const primaryBtn = getByText('Stop');
    expect(primaryBtn).toBeInTheDocument();
    expect(primaryBtn.parentElement).not.toHaveClass('ant-btn-loading');
  });

  it('should render the Stopping status', () => {
    const { getByText } = renderComponent(Status.Stopping);
    const primaryBtn = getByText('Stopping');
    expect(primaryBtn).toBeInTheDocument();
    expect(primaryBtn.parentElement).toHaveClass('ant-btn-loading');
  });

  it('should render the Stopped status', () => {
    const { getByText } = renderComponent(Status.Stopped);
    const primaryBtn = getByText('Start');
    expect(primaryBtn).toBeInTheDocument();
    expect(primaryBtn.parentElement).not.toHaveClass('ant-btn-loading');
  });

  it('should render the Error status', () => {
    const { getByText } = renderComponent(Status.Error);
    const primaryBtn = getByText('Restart');
    expect(primaryBtn).toBeInTheDocument();
    expect(primaryBtn.parentElement).not.toHaveClass('ant-btn-loading');
  });

  it('should call onClick when primary button pressed', () => {
    const { getByText } = renderComponent(Status.Stopped);
    const primaryBtn = getByText('Start');
    fireEvent.click(primaryBtn);
    expect(handleClick).toBeCalled();
  });

  it('should call onRenameClick when rename menu item clicked', async () => {
    const { getByText, getByLabelText } = renderComponent(Status.Stopped);
    fireEvent.mouseOver(getByLabelText('more'));
    await wait(() => jest.runOnlyPendingTimers());
    fireEvent.click(getByText('Rename'));
    await wait(() => jest.runOnlyPendingTimers());
    expect(handleRenameClick).toBeCalled();
  });

  it('should call onDeleteClick when rename menu item clicked', async () => {
    const { getByText, getByLabelText } = renderComponent(Status.Stopped);
    fireEvent.mouseOver(getByLabelText('more'));
    await wait(() => jest.runOnlyPendingTimers());
    fireEvent.click(getByText('Delete'));
    await wait(() => jest.runOnlyPendingTimers());
    expect(handleDeleteClick).toBeCalled();
  });

  it('should call onExportClick when export menu item clicked', async () => {
    const { getByText, getByLabelText } = renderComponent(Status.Stopped);
    fireEvent.mouseOver(getByLabelText('more'));
    await wait(() => jest.runOnlyPendingTimers());
    fireEvent.click(getByText('Export'));
    await wait(() => jest.runOnlyPendingTimers());
    expect(handleExportClick).toBeCalled();
  });

  it('should display the current block height', () => {
    const { getByText } = renderComponent(Status.Started);
    expect(getByText('height: 10')).toBeInTheDocument();
  });

  it('should mine a block when the Mine button is clicked', async () => {
    const mineMock = injections.bitcoindService.mine as jest.Mock;
    mineMock.mockResolvedValue(true);
    const { getByText, store } = renderComponent(Status.Started);
    fireEvent.click(getByText('Quick Mine'));
    await wait(() => {
      const node = store.getState().network.networks[0].nodes.bitcoin[0];
      expect(mineMock).toBeCalledWith(1, node);
    });
  });

  it('should display an error if mining fails', async () => {
    const mineMock = injections.bitcoindService.mine as jest.Mock;
    mineMock.mockRejectedValue(new Error('connection failed'));
    const { getByText, findByText } = renderComponent(Status.Started);
    fireEvent.click(getByText('Quick Mine'));
    expect(await findByText(/connection failed/)).toBeInTheDocument();
  });
});
