import React from 'react';
import { fireEvent, waitForDomChange } from '@testing-library/dom';
import { getNetwork, injections, renderWithProviders } from 'utils/tests';
import MineBlocksInput from './MineBlocksInput';

describe('MineBlocksInput', () => {
  const renderComponent = () => {
    const network = getNetwork(1, 'test network');
    const initialState = {
      network: {
        networks: [network],
      },
    };
    const cmp = <MineBlocksInput node={network.nodes.bitcoin[0]} />;
    const result = renderWithProviders(cmp, { initialState });
    return {
      ...result,
      input: result.container.querySelector('input') as HTMLInputElement,
      btn: result.getByText('Mine').parentElement as HTMLElement,
    };
  };

  it('should render label', () => {
    const { getByText } = renderComponent();
    expect(getByText('Manually Mine Blocks')).toBeInTheDocument();
  });

  it('should render button', () => {
    const { btn } = renderComponent();
    expect(btn).toBeInTheDocument();
    expect(btn).toBeInstanceOf(HTMLButtonElement);
  });

  it('should render input field', () => {
    const { input } = renderComponent();
    expect(input).toBeInTheDocument();
    expect(input).toBeInstanceOf(HTMLInputElement);
  });

  it('should use a default value of 3 for the input', () => {
    const { input } = renderComponent();
    expect(input.value).toEqual('6');
  });

  it('should mine a block when the button is clicked', async () => {
    const mineMock = injections.bitcoindService.mine as jest.Mock;
    mineMock.mockResolvedValue(true);
    const { input, btn, store } = renderComponent();
    const numBlocks = 5;
    fireEvent.change(input, { target: { value: numBlocks } });
    fireEvent.click(btn);
    await waitForDomChange();
    const port = store.getState().network.networks[0].nodes.bitcoin[0].ports.rpc;
    expect(mineMock).toBeCalledWith(numBlocks, port);
  });

  it('should display an error if mining fails', async () => {
    const mineMock = injections.bitcoindService.mine as jest.Mock;
    mineMock.mockRejectedValue(new Error('connection failed'));
    const { input, btn, findByText } = renderComponent();
    const numBlocks = 5;
    fireEvent.change(input, { target: { value: numBlocks } });
    fireEvent.click(btn);
    expect(await findByText(/connection failed/)).toBeInTheDocument();
  });

  it('should display an error if blocks is below 1', async () => {
    const { input, btn, findByText } = renderComponent();
    const numBlocks = -5;
    fireEvent.change(input, { target: { value: numBlocks } });
    fireEvent.click(btn);
    expect(await findByText(/must be a positve number/)).toBeInTheDocument();
  });
});
