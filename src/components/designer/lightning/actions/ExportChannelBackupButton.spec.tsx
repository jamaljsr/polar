import React from 'react';
import * as electron from 'electron';
import { fireEvent, waitFor } from '@testing-library/react';
import * as files from 'utils/files';
import { getNetwork, lightningServiceMock, renderWithProviders } from 'utils/tests';
import { ExportChannelBackupButton } from './';

jest.mock('utils/files', () => ({
  write: jest.fn(),
}));

const filesMock = files as jest.Mocked<typeof files>;
const dialogMock = electron.remote.dialog as jest.Mocked<typeof electron.remote.dialog>;

describe('ExportChannelBackupButton', () => {
  const renderComponent = () => {
    const network = getNetwork(1, 'test network');
    const initialState = {
      network: {
        networks: [network],
      },
    };
    const node = network.nodes.lightning[0];
    const cmp = <ExportChannelBackupButton node={node} />;
    const result = renderWithProviders(cmp, { initialState, wrapForm: true });
    return {
      ...result,
      btn: result.getByText('Export Channel Backup').parentElement as HTMLElement,
    };
  };

  it('should render label', () => {
    const { getByText } = renderComponent();
    expect(getByText('Channel Backup')).toBeInTheDocument();
  });

  it('should render button', () => {
    const { btn } = renderComponent();
    expect(btn).toBeInTheDocument();
    expect(btn).toBeInstanceOf(HTMLButtonElement);
  });

  it('should export the backup when the button is clicked', async () => {
    dialogMock.showSaveDialog.mockResolvedValue({
      filePath: 'alice-channel.backup',
    } as any);
    const backup = Buffer.from('backup-bytes', 'utf-8');
    lightningServiceMock.exportChannelBackup.mockResolvedValue(backup);
    const { btn, findByText } = renderComponent();
    fireEvent.click(btn);
    expect(await findByText('Exported channel backup for alice')).toBeInTheDocument();
    expect(filesMock.write).toHaveBeenCalledWith('alice-channel.backup', backup);
  });

  it('should not show a notification if the user aborts the dialog', async () => {
    dialogMock.showSaveDialog.mockResolvedValue({} as any);
    const { btn, queryByText } = renderComponent();
    fireEvent.click(btn);
    await waitFor(() =>
      expect(lightningServiceMock.exportChannelBackup).not.toHaveBeenCalled(),
    );
    expect(queryByText(/Exported channel backup/)).not.toBeInTheDocument();
    expect(filesMock.write).not.toHaveBeenCalled();
  });

  it('should display an error if the export fails', async () => {
    dialogMock.showSaveDialog.mockResolvedValue({
      filePath: 'alice-channel.backup',
    } as any);
    lightningServiceMock.exportChannelBackup.mockRejectedValue(
      new Error('export failed'),
    );
    const { btn, findByText } = renderComponent();
    fireEvent.click(btn);
    expect(await findByText(/export failed/)).toBeInTheDocument();
  });
});
