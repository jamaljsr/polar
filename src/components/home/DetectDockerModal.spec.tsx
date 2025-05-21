import React from 'react';
import { shell } from 'electron';
import { fireEvent } from '@testing-library/dom';
import os from 'os';
import { injections, renderWithProviders } from 'utils/tests';
import DetectDockerModal, { dockerLinks } from './DetectDockerModal';

jest.mock('os');

const mockOS = os as jest.Mocked<typeof os>;
const mockDockerService = injections.dockerService as jest.Mocked<
  typeof injections.dockerService
>;

describe('DetectDockerModal component', () => {
  let unmount: () => void;

  const renderComponent = (docker?: string, compose?: string) => {
    const initialState = {
      app: {
        dockerVersions: {
          docker: docker || '',
          compose: compose || '',
        },
      },
    };
    const result = renderWithProviders(<DetectDockerModal />, { initialState });
    unmount = result.unmount;
    return result;
  };

  beforeEach(() => {
    mockOS.platform.mockReturnValue('darwin');
  });

  afterEach(() => unmount());

  it('should display UI elements', () => {
    const { getByText, getAllByText } = renderComponent();
    expect(
      getByText('Docker not detected. Make sure Docker is both installed and running.'),
    ).toBeInTheDocument();
    expect(getByText('Installed Docker Versions')).toBeInTheDocument();
    expect(getByText('Check Again')).toBeInTheDocument();
    expect(getAllByText('Not Found')).toHaveLength(2);
  });

  it('should not display modal if docker versions are set', () => {
    const { queryByText } = renderComponent('1.2.3', '4.5.6');
    expect(
      queryByText('Docker not detected. Make sure Docker is both installed and running.'),
    ).toBeNull();
  });

  it('should display modal if docker version is not set', () => {
    const { getByText } = renderComponent('', '1.2.3');
    expect(
      getByText('Docker not detected. Make sure Docker is both installed and running.'),
    ).toBeInTheDocument();
    expect(getByText('1.2.3')).toBeInTheDocument();
  });

  it('should display modal if compose version is not set', () => {
    const { getByText } = renderComponent('1.2.3');
    expect(
      getByText('Docker not detected. Make sure Docker is both installed and running.'),
    ).toBeInTheDocument();
    expect(getByText('1.2.3')).toBeInTheDocument();
  });

  it('should display download button for mac', () => {
    mockOS.platform.mockReturnValue('darwin');
    const { getByText, getByLabelText } = renderComponent();
    expect(getByText('Download Docker Desktop')).toBeInTheDocument();
    expect(getByLabelText('apple')).toBeInTheDocument();
  });

  it('should open browser when download button clicked on mac', () => {
    shell.openExternal = jest.fn().mockResolvedValue(true);
    mockOS.platform.mockReturnValue('darwin');
    const { getByText } = renderComponent();
    fireEvent.click(getByText('Download Docker Desktop'));
    expect(shell.openExternal).toBeCalledTimes(1);
    expect(shell.openExternal).toBeCalledWith(dockerLinks.mac['Docker Desktop']);
  });

  it('should display download button for windows', () => {
    mockOS.platform.mockReturnValue('win32');
    const { getByText, getByLabelText } = renderComponent();
    expect(getByText('Download Docker Desktop')).toBeInTheDocument();
    expect(getByLabelText('windows')).toBeInTheDocument();
  });

  it('should open browser when download button clicked on windows', () => {
    shell.openExternal = jest.fn().mockResolvedValue(true);
    mockOS.platform.mockReturnValue('win32');
    const { getByText } = renderComponent();
    fireEvent.click(getByText('Download Docker Desktop'));
    expect(shell.openExternal).toBeCalledTimes(1);
    expect(shell.openExternal).toBeCalledWith(dockerLinks.windows['Docker Desktop']);
  });

  it('should display download button for linux', () => {
    mockOS.platform.mockReturnValue('linux');
    const { getByText, getAllByLabelText } = renderComponent();
    expect(getByText('Download Docker')).toBeInTheDocument();
    expect(getByText('Download Docker Compose')).toBeInTheDocument();
    expect(getAllByLabelText('download')).toHaveLength(2);
  });

  it('should open browser when download buttons clicked on linux', () => {
    shell.openExternal = jest.fn().mockResolvedValue(true);
    mockOS.platform.mockReturnValue('linux');
    const { getByText } = renderComponent();
    fireEvent.click(getByText('Download Docker'));
    expect(shell.openExternal).toBeCalledTimes(1);
    expect(shell.openExternal).toBeCalledWith(dockerLinks.linux['Docker']);
    fireEvent.click(getByText('Download Docker Compose'));
    expect(shell.openExternal).toBeCalledTimes(2);
    expect(shell.openExternal).toBeCalledWith(dockerLinks.linux['Docker Compose']);
  });

  it('should fetch docker versions when Check Again button clicked', async () => {
    mockDockerService.getVersions.mockResolvedValue({ docker: '1.2.3', compose: '' });
    const { getByText, queryByText, findByText } = renderComponent();
    expect(queryByText('1.2.3')).toBeNull();
    fireEvent.click(getByText('Check Again'));
    expect(await findByText('1.2.3')).toBeInTheDocument();
  });

  it('should display a notification if Check Again fails', async () => {
    mockDockerService.getVersions.mockRejectedValue(new Error('test-error'));
    const { getByText, findByText } = renderComponent();
    fireEvent.click(getByText('Check Again'));
    expect(await findByText('Docker Error')).toBeInTheDocument();
    expect(await findByText('test-error')).toBeInTheDocument();
  });
});
