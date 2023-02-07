import React from 'react';
import { fireEvent } from '@testing-library/dom';
import { waitFor } from '@testing-library/react';
import { Status } from 'shared/types';
import { initChartFromNetwork } from 'utils/chart';
import {
  defaultTaroBalance,
  getNetwork,
  renderWithProviders,
  taroServiceMock,
} from 'utils/tests';
import NewAddressModal from './NewAddressModal';

describe('NewAddressModal', () => {
  let unmount: () => void;

  const renderComponent = async () => {
    const network = getNetwork(1, 'test network', Status.Started, 2);

    const initialState = {
      network: {
        networks: [network],
      },
      designer: {
        activeId: network.id,
        allCharts: {
          [network.id]: initChartFromNetwork(network),
        },
      },
      modals: {
        newAddress: {
          visible: true,
          nodeName: 'alice-taro',
        },
      },
    };
    const cmp = <NewAddressModal network={network} />;
    const result = renderWithProviders(cmp, { initialState, wrapForm: true });
    unmount = result.unmount;
    return {
      ...result,
      network,
    };
  };

  afterEach(() => unmount());

  it('should render form inputs', async () => {
    const { getByLabelText, getByText } = await renderComponent();
    expect(
      getByLabelText('Generate new Taro address for alice-taro'),
    ).toBeInTheDocument();
    expect(getByLabelText('Amount')).toBeInTheDocument();
    expect(getByLabelText('Genesis Bootstrap Info')).toBeInTheDocument();
    expect(getByText('Choose a balance from Taro node')).toBeInTheDocument();
  });

  it('should render button', async () => {
    const { getByText } = await renderComponent();
    const btn = getByText('Generate');
    expect(btn).toBeInTheDocument();
    expect(btn.parentElement).toBeInstanceOf(HTMLButtonElement);
  });

  it('should fill genesis bootstrap info from another node', async () => {
    taroServiceMock.listBalances.mockImplementation(async node => {
      return node.name === 'bob-taro'
        ? [
            defaultTaroBalance({
              name: 'LUSD',
              type: 'NORMAL',
              balance: '100',
              genesisBootstrapInfo: 'test-bootstrap-info',
            }),
          ]
        : [];
    });
    const { getByLabelText, changeSelect, store } = await renderComponent();
    await waitFor(() => {
      expect(store.getState().taro.nodes['bob-taro']?.balances).toBeDefined();
    });
    changeSelect('Choose a balance from Taro node', 'LUSD');
    expect(getByLabelText('Genesis Bootstrap Info')).toHaveValue('test-bootstrap-info');
    expect(getByLabelText('Amount')).toHaveValue('10');
  });

  it('should set the amount to 1 when a collectible is chosen', async () => {
    taroServiceMock.listBalances.mockImplementation(async node => {
      return node.name === 'bob-taro'
        ? [
            defaultTaroBalance({
              name: 'LUSD',
              type: 'COLLECTIBLE',
              balance: '100',
              genesisBootstrapInfo: 'test-bootstrap-info',
            }),
          ]
        : [];
    });
    const { getByLabelText, changeSelect, store } = await renderComponent();
    await waitFor(() => {
      expect(store.getState().taro.nodes['bob-taro']?.balances).toBeDefined();
    });
    changeSelect('Choose a balance from Taro node', 'LUSD');
    expect(getByLabelText('Genesis Bootstrap Info')).toHaveValue('test-bootstrap-info');
    expect(getByLabelText('Amount')).toHaveValue('1');
  });

  it('should hide modal when cancel is clicked', async () => {
    const { getByText, queryByText, store } = await renderComponent();
    const btn = getByText('Cancel');
    expect(btn).toBeInTheDocument();
    expect(btn.parentElement).toBeInstanceOf(HTMLButtonElement);
    fireEvent.click(btn);
    await waitFor(() => {
      expect(store.getState().modals.mintAsset.visible).toBe(false);
      expect(queryByText('Cancel')).not.toBeInTheDocument();
    });
  });

  describe('with form submitted', () => {
    beforeEach(() => {
      // make each node's balance different
      taroServiceMock.newAddress.mockResolvedValue({
        encoded: 'taro1address',
        id: 'id',
        type: 'NORMAL',
        amount: '10',
        family: undefined,
        scriptKey: 'scriptKey',
        internalKey: 'internalKey',
        taprootOutputKey: 'taprootOutputKey',
      });
    });

    it('should generate address', async () => {
      const { getByText, getByLabelText, getByDisplayValue, findByText, network } =
        await renderComponent();
      const btn = getByText('Generate');
      expect(btn).toBeInTheDocument();
      expect(btn.parentElement).toBeInstanceOf(HTMLButtonElement);
      fireEvent.change(getByLabelText('Genesis Bootstrap Info'), {
        target: { value: 'taro1' },
      });
      fireEvent.change(getByLabelText('Amount'), { target: { value: '100' } });
      fireEvent.click(getByText('Generate'));
      expect(await findByText('Successfully created address')).toBeInTheDocument();
      expect(getByDisplayValue('taro1address')).toBeInTheDocument();
      const node = network.nodes.taro[0];
      expect(taroServiceMock.newAddress).toBeCalledWith(node, {
        genesisBootstrapInfo: Buffer.from('taro1', 'hex'),
        amt: 100,
      });
    });

    it('should close the modal', async () => {
      const { getByText, findByText, getByLabelText, store } = await renderComponent();
      fireEvent.change(getByLabelText('Genesis Bootstrap Info'), {
        target: { value: 'taro1' },
      });
      fireEvent.change(getByLabelText('Amount'), {
        target: { value: '1000' },
      });
      fireEvent.click(getByText('Generate'));
      fireEvent.click(await findByText('Copy & Close'));
      expect(store.getState().modals.newAddress.visible).toBe(false);
      expect(getByText('Copied taro1address to the clipboard')).toBeInTheDocument();
    });

    it('should display an error when creating the taro address fails', async () => {
      taroServiceMock.newAddress.mockRejectedValue(new Error('error-msg'));
      const { getByText, findByText, getByLabelText } = await renderComponent();
      fireEvent.change(getByLabelText('Genesis Bootstrap Info'), {
        target: { value: 'taro1' },
      });
      fireEvent.change(getByLabelText('Amount'), {
        target: { value: '1000' },
      });
      // await waitFor(() => );
      fireEvent.click(getByText('Generate'));
      expect(await findByText('error-msg')).toBeInTheDocument();
    });
  });
});
