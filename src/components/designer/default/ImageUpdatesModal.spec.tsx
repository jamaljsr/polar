import React from 'react';
import { fireEvent, waitForElementToBeRemoved } from '@testing-library/react';
import { defaultRepoState } from 'utils/constants';
import { injections, renderWithProviders } from 'utils/tests';
import ImageUpdatesModal from './ImageUpdatesModal';

const mockRepoService = injections.repoService as jest.Mocked<
  typeof injections.repoService
>;

describe('ImageUpdatesModal', () => {
  const handleClose = jest.fn();
  const renderComponent = async () => {
    const initialState = {
      app: {
        dockerRepoState: defaultRepoState,
      },
    };
    const cmp = <ImageUpdatesModal onClose={handleClose} />;
    return renderWithProviders(cmp, { initialState });
  };

  beforeEach(() => {
    mockRepoService.checkForUpdates.mockResolvedValue({
      state: defaultRepoState,
    });
  });

  it('should display title & buttons', async () => {
    const { getByText, getByLabelText } = await renderComponent();
    expect(getByText('Check for new Node Versions')).toBeInTheDocument();
    expect(getByText('Add New Versions')).toBeInTheDocument();
    expect(getByText('Add New Versions')).not.toBeVisible();
    await waitForElementToBeRemoved(() => getByLabelText('icon: loading'));
  });

  it('should display a loader', async () => {
    const { getByLabelText } = await renderComponent();
    expect(getByLabelText('icon: loading')).toBeInTheDocument();
    await waitForElementToBeRemoved(() => getByLabelText('icon: loading'));
  });

  it('should display up to date message', async () => {
    const { findByText } = await renderComponent();
    expect(await findByText('You are up to date!')).toBeInTheDocument();
  });

  it('should display an error message', async () => {
    mockRepoService.checkForUpdates.mockRejectedValue(new Error('test-error'));
    const { findByText } = await renderComponent();
    expect(await findByText('Failed to check for updates!')).toBeInTheDocument();
    expect(await findByText('test-error')).toBeInTheDocument();
  });

  describe('with available updates', () => {
    beforeEach(() => {
      mockRepoService.checkForUpdates.mockResolvedValue({
        state: defaultRepoState,
        updates: {
          LND: ['1.2.3'],
          'c-lightning': [],
          eclair: [],
          bitcoind: ['4.5.6'],
          btcd: [],
        },
      });
    });

    it('should display updated versions', async () => {
      const { findByText, getByText } = await renderComponent();
      expect(
        await findByText('There are new node versions available'),
      ).toBeInTheDocument();

      ['LND', 'v1.2.3', 'Bitcoin Core', 'v4.5.6'].forEach(text => {
        expect(getByText(text)).toBeInTheDocument();
      });
    });

    it('should display the Add button', async () => {
      const { findByText } = await renderComponent();
      expect(await findByText('Add New Versions')).toBeInTheDocument();
    });

    it('should display a success notification', async () => {
      const { findByText } = await renderComponent();
      expect(await findByText('Add New Versions')).toBeInTheDocument();
      fireEvent.click(await findByText('Add New Versions'));
      expect(
        await findByText('The new node versions are now available to use'),
      ).toBeInTheDocument();
    });

    it('should display a success notification with no updates', async () => {
      mockRepoService.checkForUpdates.mockResolvedValue({
        state: defaultRepoState,
      });
      const { findByText } = await renderComponent();
      expect(await findByText('Add New Versions')).toBeInTheDocument();
      fireEvent.click(await findByText('Add New Versions'));
      expect(
        await findByText('The new node versions are now available to use'),
      ).toBeInTheDocument();
    });

    it('should display an error notification', async () => {
      mockRepoService.save.mockRejectedValueOnce(new Error('test-error'));
      const { findByText } = await renderComponent();
      expect(await findByText('Add New Versions')).toBeInTheDocument();
      fireEvent.click(await findByText('Add New Versions'));
      expect(await findByText('Failed to add the new versions')).toBeInTheDocument();
      expect(await findByText('test-error')).toBeInTheDocument();
    });
  });
});
