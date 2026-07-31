import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react';
import { Network } from 'types';
import {
  getNetwork,
  lightningServiceMock,
  lndServiceMock,
  renderWithProviders,
} from 'utils/tests';
import UnlockNodeModal from './UnlockNodeModal';

describe('UnlockNodeModal', () => {
  let unmount: () => void;
  let network: Network;

  const renderComponent = (nodeName = 'alice') => {
    network = getNetwork(1, 'test network');
    const initialState = {
      network: { networks: [network] },
      modals: {
        unlockNode: {
          visible: true,
          nodeName,
        },
      },
    };
    const cmp = <UnlockNodeModal network={network} />;
    const result = renderWithProviders(cmp, { initialState });
    unmount = result.unmount;
    return result;
  };

  afterEach(() => unmount());

  it('should display a loader while wallet state is resolving', async () => {
    lndServiceMock.getWalletState.mockImplementation(() => new Promise(() => {}));
    const { findByLabelText } = renderComponent();
    expect(await findByLabelText('loading')).toBeInTheDocument();
  });

  it('should do nothing when submitted with an unknown node name', async () => {
    const { findByText, getByText } = renderComponent('doesnotexist');
    await findByText('Unlock Node doesnotexist');
    fireEvent.click(getByText('Unlock'));
    expect(lndServiceMock.unlockWallet).not.toHaveBeenCalled();
  });

  describe('with wallet LOCKED', () => {
    beforeEach(() => {
      lndServiceMock.getWalletState.mockResolvedValue('LOCKED');
    });

    it('should render the unlock form', async () => {
      const { findByText, findByLabelText } = renderComponent();
      expect(await findByText('Unlock Node alice')).toBeInTheDocument();
      expect(await findByLabelText('Wallet Password')).toHaveValue('polarpass');
    });

    it('should hide the modal when cancel is clicked', async () => {
      const { findByText, getByText, store } = renderComponent();
      await findByText('Unlock Node alice');
      fireEvent.click(getByText('Cancel'));
      expect(store.getState().modals.unlockNode.visible).toBe(false);
    });

    it('should unlock the node and close the modal on success', async () => {
      lndServiceMock.unlockWallet.mockResolvedValue();
      lightningServiceMock.waitUntilOnline.mockResolvedValue();
      const { findByText, getByText, store } = renderComponent();
      await findByText('Unlock Node alice');
      fireEvent.click(getByText('Unlock'));
      await waitFor(() => {
        expect(lndServiceMock.unlockWallet).toHaveBeenCalledWith(
          expect.objectContaining({ name: 'alice' }),
          'polarpass',
        );
        expect(store.getState().modals.unlockNode.visible).toBe(false);
      });
    });

    it('should display a friendly error for a wrong password', async () => {
      lndServiceMock.unlockWallet.mockRejectedValue(new Error('invalid passphrase'));
      const { findByText, getByText } = renderComponent();
      await findByText('Unlock Node alice');
      fireEvent.click(getByText('Unlock'));
      expect(await findByText('Unable to unlock the wallet')).toBeInTheDocument();
      expect(await findByText('invalid passphrase')).toBeInTheDocument();
    });
  });

  describe('with wallet NON_EXISTING', () => {
    beforeEach(() => {
      lndServiceMock.getWalletState.mockResolvedValue('NON_EXISTING');
    });

    it('should render the init form', async () => {
      const { findByText, findByLabelText } = renderComponent();
      expect(await findByText('Initialize Node alice')).toBeInTheDocument();
      expect(await findByLabelText('Wallet Password')).toHaveValue('polarpass');
    });

    it('should display a validation error for a short password', async () => {
      const { findByText, getByText, getByLabelText } = renderComponent();
      await findByText('Initialize Node alice');
      fireEvent.change(getByLabelText('Wallet Password'), {
        target: { value: 'short' },
      });
      fireEvent.click(getByText('Initialize'));
      expect(await findByText('Must be at least 8 characters')).toBeInTheDocument();
      expect(lndServiceMock.genSeed).not.toHaveBeenCalled();
    });

    it('should initialize the wallet and display the seed phrase', async () => {
      lndServiceMock.genSeed.mockResolvedValue(['abandon', 'ability']);
      lndServiceMock.initWallet.mockResolvedValue(Buffer.from('admin-macaroon'));
      lightningServiceMock.waitUntilOnline.mockResolvedValue();
      const { findByText, getByText, store } = renderComponent();
      await findByText('Initialize Node alice');
      fireEvent.click(getByText('Initialize'));
      expect(await findByText('Wallet Seed for alice')).toBeInTheDocument();
      expect(getByText(/1\. abandon/)).toBeInTheDocument();
      expect(getByText(/2\. ability/)).toBeInTheDocument();
      // modal stays open until the user acknowledges the seed
      expect(store.getState().modals.unlockNode.visible).toBe(true);
      fireEvent.click(getByText('Done'));
      expect(store.getState().modals.unlockNode.visible).toBe(false);
    });

    it('should display an error if initialization fails', async () => {
      lndServiceMock.genSeed.mockRejectedValue(new Error('test-error'));
      const { findByText, getByText } = renderComponent();
      await findByText('Initialize Node alice');
      fireEvent.click(getByText('Initialize'));
      expect(await findByText('Unable to initialize the wallet')).toBeInTheDocument();
      expect(await findByText('test-error')).toBeInTheDocument();
    });
  });
});
