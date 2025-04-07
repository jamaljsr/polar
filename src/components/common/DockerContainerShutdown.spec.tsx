import React from 'react';
import { ipcRenderer, IpcRendererEvent } from 'electron';
import { waitFor } from '@testing-library/react';
import { renderWithProviders } from 'utils/tests';
import DockerContainerShutdown from './DockerContainerShutdown';

const ipcRenderMock = ipcRenderer as jest.Mocked<typeof ipcRenderer>;

describe('DockerContainerShutdown component', () => {
  let unmount: () => void;
  const renderComponent = async () => {
    const cmp = <DockerContainerShutdown />;
    const result = renderWithProviders(cmp);
    unmount = result.unmount;
    return result;
  };
  afterEach(() => unmount());
  it('should not display overlay when shutting down', async () => {
    const { queryByText } = await renderComponent();
    expect(queryByText('Shutting down...')).toBeNull();
  });

  it('should set isShuttingDown to true when app is closing', async () => {
    let callback: (event: IpcRendererEvent, ...args: any[]) => void = () => {};
    ipcRenderMock.on.mockImplementationOnce((event, cb) => {
      callback = cb;
      return ipcRenderMock;
    });
    const { getByText } = await renderComponent();

    callback('app-closing' as any);
    await waitFor(() => expect(getByText('Shutting down...')).toBeInTheDocument());
  });
});
