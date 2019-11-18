import React from 'react';
import { fireEvent, waitForElement } from '@testing-library/dom';
import { defaultInfo } from 'shared';
import { BitcoindLibrary, LndLibrary } from 'types';
import { groupNodes } from 'utils/network';
import { getNetwork, injections, renderWithProviders } from 'utils/tests';
import { Deposit } from './';

const lndServiceMock = injections.lndService as jest.Mocked<LndLibrary>;
const bitcoindServiceMock = injections.bitcoindService as jest.Mocked<BitcoindLibrary>;

describe('Deposit', () => {
  const renderComponent = () => {
    const network = getNetwork(1, 'test network');
    const initialState = {
      network: {
        networks: [network],
      },
    };
    const node = groupNodes(network).lnd[0];
    const cmp = <Deposit node={node} />;
    const result = renderWithProviders(cmp, { initialState });
    return {
      ...result,
      input: result.container.querySelector('input') as HTMLInputElement,
      btn: result.getByText('Deposit').parentElement as HTMLElement,
    };
  };

  beforeEach(() => {
    bitcoindServiceMock.sendFunds.mockResolvedValue('txid');
    lndServiceMock.getNewAddress.mockResolvedValue({ address: 'bc1aaaa' });
    lndServiceMock.getInfo.mockResolvedValue(
      defaultInfo({
        alias: 'my-node',
        identityPubkey: 'abcdef',
        syncedToChain: true,
      }),
    );
    lndServiceMock.getWalletBalance.mockResolvedValue({
      confirmedBalance: '100',
      unconfirmedBalance: '200',
      totalBalance: '300',
    });
  });

  it('should render label', () => {
    const { getByText } = renderComponent();
    expect(getByText('Deposit Funds')).toBeInTheDocument();
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

  it('should use a default value of 100000 for the input', () => {
    const { input } = renderComponent();
    expect(input.value).toEqual('1,000,000');
  });

  it('should deposit funds when the button is clicked', async () => {
    const { input, btn, getByText } = renderComponent();
    const amount = '250000';
    fireEvent.change(input, { target: { value: amount } });
    fireEvent.click(btn);
    await waitForElement(() => getByText('Deposited 250,000 sats to alice'));
    expect(lndServiceMock.getNewAddress).toBeCalledTimes(1);
    expect(bitcoindServiceMock.sendFunds).toBeCalledWith(
      expect.anything(),
      'bc1aaaa',
      0.0025,
    );
  });

  it('should display an error if mining fails', async () => {
    bitcoindServiceMock.sendFunds.mockRejectedValue(new Error('connection failed'));
    const { input, btn, findByText } = renderComponent();
    const numBlocks = 5;
    fireEvent.change(input, { target: { value: numBlocks } });
    fireEvent.click(btn);
    expect(await findByText(/connection failed/)).toBeInTheDocument();
  });
});
