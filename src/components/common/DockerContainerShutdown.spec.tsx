import React from 'react';
import { renderWithProviders } from 'utils/tests';
import DockerContainerShutdown from './DockerContainerShutdown';
import { ipcRenderer } from '__mocks__/electron';
import { waitFor } from '@testing-library/react';

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
    const { getByText } = await renderComponent();

    ipcRenderer.on.mock.calls[0][1]();
    await waitFor(() => expect(getByText('Shutting down...')).toBeInTheDocument());
  });
});
