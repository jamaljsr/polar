import React from 'react';
import { fireEvent } from '@testing-library/dom';
import { waitFor } from '@testing-library/react';
import { Status } from 'shared/types';
import { initChartFromNetwork } from 'utils/chart';
import { getNetwork, renderWithProviders, tapServiceMock } from 'utils/tests';
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
          nodeName: 'alice-tap',
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
    const { getByLabelText } = await renderComponent();
    expect(getByLabelText('Generate new TAP address for alice-tap')).toBeInTheDocument();
    expect(getByLabelText('Asset')).toBeInTheDocument();
    expect(getByLabelText('Amount')).toBeInTheDocument();
  });

  it('should render button', async () => {
    const { getByText } = await renderComponent();
    const btn = getByText('Generate');
    expect(btn).toBeInTheDocument();
    expect(btn.parentElement).toBeInstanceOf(HTMLButtonElement);
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
      tapServiceMock.assetRoots.mockResolvedValue([
        {
          id: 'test-id',
          name: 'LUSD',
          rootSum: 1000,
        },
      ]);
      tapServiceMock.newAddress.mockResolvedValue({
        encoded: 'tap1address',
        id: 'id',
        type: 'NORMAL',
        amount: '10',
        family: undefined,
        scriptKey: 'scriptKey',
        internalKey: 'internalKey',
        taprootOutputKey: 'taprootOutputKey',
      });
      tapServiceMock.syncUniverse.mockResolvedValue({
        syncedUniverses: ['dummy-data' as any],
      });
    });

    it('should generate address', async () => {
      const {
        getByText,
        getByLabelText,
        getByDisplayValue,
        findByText,
        changeSelect,
        store,
        network,
      } = await renderComponent();
      const btn = getByText('Generate');
      expect(btn).toBeInTheDocument();
      expect(btn.parentElement).toBeInstanceOf(HTMLButtonElement);
      await store.getActions().tap.getAssetRoots(network.nodes.tap[0]);
      changeSelect('Asset', 'LUSD');
      fireEvent.change(getByLabelText('Amount'), { target: { value: '100' } });
      fireEvent.click(getByText('Generate'));
      expect(await findByText('Successfully created address')).toBeInTheDocument();
      expect(getByDisplayValue('tap1address')).toBeInTheDocument();
      const node = network.nodes.tap[0];
      expect(tapServiceMock.newAddress).toBeCalledWith(node, 'test-id', '100');
    });

    it('should close the modal', async () => {
      const { getByText, findByText, getByLabelText, changeSelect, store, network } =
        await renderComponent();
      await store.getActions().tap.getAssetRoots(network.nodes.tap[0]);
      changeSelect('Asset', 'LUSD');
      fireEvent.change(getByLabelText('Amount'), {
        target: { value: '1000' },
      });
      fireEvent.click(getByText('Generate'));
      fireEvent.click(await findByText('Copy & Close'));
      expect(store.getState().modals.newAddress.visible).toBe(false);
      expect(getByText('Copied tap1address to the clipboard')).toBeInTheDocument();
    });

    it('should sync from another node', async () => {
      const { getByText, findByText, getByLabelText } = await renderComponent();
      fireEvent.mouseOver(getByText('Sync assets from node'));
      fireEvent.click(await findByText('bob-tap'));
      fireEvent.mouseDown(getByLabelText('Asset'));
      expect(await findByText('Synced 1 assets from bob-tap')).toBeInTheDocument();
    });

    it('should handle errors when syncing from another node', async () => {
      tapServiceMock.syncUniverse.mockRejectedValue(new Error('error-msg'));
      const { getByText, findByText, getByLabelText } = await renderComponent();
      fireEvent.mouseOver(getByText('Sync assets from node'));
      fireEvent.click(await findByText('bob-tap'));
      fireEvent.mouseDown(getByLabelText('Asset'));
      expect(await findByText('Failed to sync assets from bob-tap')).toBeInTheDocument();
      expect(await findByText('error-msg')).toBeInTheDocument();
    });

    it('should display an error when creating the tap address fails', async () => {
      tapServiceMock.newAddress.mockRejectedValue(new Error('error-msg'));
      const { getByText, findByText, getByLabelText, changeSelect, store, network } =
        await renderComponent();
      await store.getActions().tap.getAssetRoots(network.nodes.tap[0]);
      changeSelect('Asset', 'LUSD');
      fireEvent.change(getByLabelText('Amount'), {
        target: { value: '1000' },
      });
      fireEvent.click(getByText('Generate'));
      expect(await findByText('error-msg')).toBeInTheDocument();
    });
  });
});
