import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react';
import { Network } from 'types';
import * as files from 'utils/files';
import {
  getNetwork,
  lightningServiceMock,
  lndServiceMock,
  renderWithProviders,
} from 'utils/tests';
import UnlockNodeModal from './UnlockNodeModal';

jest.mock('utils/files', () => ({
  readBuffer: jest.fn(),
}));

const filesMock = files as jest.Mocked<typeof files>;

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

    it('should not offer to restore a wallet that already exists', async () => {
      const { findByText, queryByText } = renderComponent();
      await findByText('Unlock Node alice');
      expect(queryByText('Restore existing wallet')).not.toBeInTheDocument();
      expect(queryByText('Create new wallet')).not.toBeInTheDocument();
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

    describe('in restore mode', () => {
      const words = Array.from({ length: 24 }, (_, i) => `word${i + 1}`);
      const backupBytes = Buffer.from([0x00, 0xff, 0x80]);
      const wordCountError = 'The seed phrase must contain exactly 24 words';
      const backupNotice = /force-close its channel/;

      const renderRestore = async () => {
        const result = renderComponent();
        await result.findByText('Initialize Node alice');
        fireEvent.click(result.getByText('Restore existing wallet'));
        await result.findByText('Restore Wallet for alice');
        return result;
      };

      const enterSeed = (result: ReturnType<typeof renderComponent>, phrase: string) => {
        fireEvent.change(result.getByLabelText('Seed Phrase'), {
          target: { value: phrase },
        });
      };

      const attachBackup = (result: ReturnType<typeof renderComponent>) => {
        // the modal renders into a portal, so query from the document body
        const input = result.baseElement.querySelector(
          'input[type=file]',
        ) as HTMLInputElement;
        const file = new File(['backup'], 'channel.backup');
        file.path = '/tmp/alice/channel.backup';
        Object.defineProperty(input, 'files', { value: [file] });
        fireEvent.change(input);
      };

      beforeEach(() => {
        lndServiceMock.initWallet.mockResolvedValue(Buffer.from('admin-macaroon'));
        lightningServiceMock.waitUntilOnline.mockResolvedValue();
        filesMock.readBuffer.mockResolvedValue(backupBytes);
      });

      it('should switch to the restore form', async () => {
        const { getByLabelText, getByText } = await renderRestore();
        expect(getByLabelText('Seed Phrase')).toBeInTheDocument();
        expect(getByLabelText('Wallet Password')).toHaveValue('polarpass');
        expect(getByText('Click or drag a channel.backup file here')).toBeInTheDocument();
        expect(getByText('Restore')).toBeInTheDocument();
      });

      it('should restore the wallet with a channel backup', async () => {
        const result = await renderRestore();
        const { findByText, getByText, queryByText, store } = result;
        enterSeed(result, words.join(' '));
        attachBackup(result);
        // the attached file and the force-close explanation are shown before submitting
        expect(await findByText('channel.backup')).toBeInTheDocument();
        expect(getByText(backupNotice)).toBeInTheDocument();
        fireEvent.click(getByText('Restore'));
        await waitFor(() => {
          expect(lndServiceMock.initWallet).toHaveBeenCalledWith(
            expect.objectContaining({ name: 'alice' }),
            'polarpass',
            words,
            expect.objectContaining({ channelBackup: backupBytes }),
          );
        });
        expect(filesMock.readBuffer).toHaveBeenCalledWith('/tmp/alice/channel.backup');
        expect(lndServiceMock.genSeed).not.toHaveBeenCalled();
        expect(await findByText(/are being force-closed/)).toBeInTheDocument();
        expect(store.getState().modals.unlockNode.visible).toBe(false);
        // the generated-seed view must never appear for a restored wallet
        expect(queryByText('Wallet Seed for alice')).not.toBeInTheDocument();
      });

      it('should restore the wallet without a channel backup', async () => {
        const result = await renderRestore();
        const { findByText, getByText, queryByText, store } = result;
        enterSeed(result, words.join(' '));
        expect(queryByText(backupNotice)).not.toBeInTheDocument();
        fireEvent.click(getByText('Restore'));
        await waitFor(() => {
          expect(lndServiceMock.initWallet).toHaveBeenCalledWith(
            expect.objectContaining({ name: 'alice' }),
            'polarpass',
            words,
            expect.objectContaining({ channelBackup: undefined }),
          );
        });
        expect(filesMock.readBuffer).not.toHaveBeenCalled();
        expect(lndServiceMock.genSeed).not.toHaveBeenCalled();
        expect(await findByText(/restored from its seed phrase/)).toBeInTheDocument();
        expect(store.getState().modals.unlockNode.visible).toBe(false);
      });

      it('should not send a backup that was attached and then removed', async () => {
        const result = await renderRestore();
        const { findByText, getByText, queryByText } = result;
        enterSeed(result, words.join(' '));
        attachBackup(result);
        await findByText('channel.backup');
        fireEvent.click(getByText('Remove'));
        expect(queryByText('channel.backup')).not.toBeInTheDocument();
        expect(queryByText(backupNotice)).not.toBeInTheDocument();
        expect(getByText('Click or drag a channel.backup file here')).toBeInTheDocument();
        fireEvent.click(getByText('Restore'));
        await waitFor(() => {
          expect(lndServiceMock.initWallet).toHaveBeenCalledWith(
            expect.objectContaining({ name: 'alice' }),
            'polarpass',
            words,
            expect.objectContaining({ channelBackup: undefined }),
          );
        });
        expect(filesMock.readBuffer).not.toHaveBeenCalled();
        expect(await findByText(/restored from its seed phrase/)).toBeInTheDocument();
      });

      it('should reject a seed phrase with the wrong number of words', async () => {
        const result = await renderRestore();
        const { findByText, getByText } = result;
        enterSeed(result, words.slice(0, 23).join(' '));
        fireEvent.click(getByText('Restore'));
        expect(await findByText(wordCountError)).toBeInTheDocument();
        enterSeed(result, [...words, 'extra'].join(' '));
        fireEvent.click(getByText('Restore'));
        expect(await findByText(wordCountError)).toBeInTheDocument();
        expect(lndServiceMock.initWallet).not.toHaveBeenCalled();
        expect(lndServiceMock.genSeed).not.toHaveBeenCalled();
      });

      it('should reject an empty seed phrase', async () => {
        const result = await renderRestore();
        const { findByText, getByText } = result;
        fireEvent.click(getByText('Restore'));
        expect(await findByText(wordCountError)).toBeInTheDocument();
        expect(lndServiceMock.initWallet).not.toHaveBeenCalled();
      });

      it('should accept a seed phrase pasted with newlines and extra whitespace', async () => {
        const result = await renderRestore();
        const { getByText } = result;
        enterSeed(result, `  ${words.join('\n')}  \n`);
        fireEvent.click(getByText('Restore'));
        await waitFor(() => {
          expect(lndServiceMock.initWallet).toHaveBeenCalledWith(
            expect.objectContaining({ name: 'alice' }),
            'polarpass',
            words,
            expect.anything(),
          );
        });
      });

      it('should display an error if the restore fails', async () => {
        lndServiceMock.initWallet.mockRejectedValue(new Error('invalid seed'));
        const result = await renderRestore();
        const { findByText, getByText, queryByText, store } = result;
        enterSeed(result, words.join(' '));
        fireEvent.click(getByText('Restore'));
        expect(await findByText('Unable to restore the wallet')).toBeInTheDocument();
        expect(await findByText('invalid seed')).toBeInTheDocument();
        // the modal stays open so the user can correct the seed
        expect(store.getState().modals.unlockNode.visible).toBe(true);
        expect(queryByText('Wallet Seed for alice')).not.toBeInTheDocument();
      });

      it('should reset to create mode and drop the backup when closed', async () => {
        const result = await renderRestore();
        const { findByText, getByText, queryByText, store } = result;
        attachBackup(result);
        await findByText('channel.backup');
        fireEvent.click(getByText('Cancel'));
        expect(store.getState().modals.unlockNode.visible).toBe(false);
        // re-opening must start from the create form with nothing attached
        store.getActions().modals.showUnlockNode({ nodeName: 'alice' });
        expect(await findByText('Initialize Node alice')).toBeInTheDocument();
        expect(queryByText('Seed Phrase')).not.toBeInTheDocument();
        fireEvent.click(getByText('Restore existing wallet'));
        await findByText('Restore Wallet for alice');
        expect(queryByText('channel.backup')).not.toBeInTheDocument();
      });
    });
  });
});
