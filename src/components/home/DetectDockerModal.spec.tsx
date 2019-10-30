import React from 'react';
import { shell } from 'electron';
import { fireEvent } from '@testing-library/dom';
import * as system from 'utils/system';
import { injections, mockProperty, renderWithProviders } from 'utils/tests';
import DetectDockerModal, { dockerLinks } from './DetectDockerModal';

jest.mock('utils/system');

const mockDockerService = injections.dockerService as jest.Mocked<
  typeof injections.dockerService
>;

describe('DetectDockerModal component', () => {
  const renderComponent = (docker?: string, compose?: string) => {
    const initialState = {
      app: {
        dockerVersions: {
          docker: docker || '',
          compose: compose || '',
        },
      },
    };
    return renderWithProviders(<DetectDockerModal />, { initialState });
  };

  it('should display UI elements', () => {
    const { getByText, getAllByText } = renderComponent();
    expect(getByText('Docker Not Detected')).toBeInTheDocument();
    expect(getByText('Installed Docker Versions')).toBeInTheDocument();
    expect(getByText('Check Again')).toBeInTheDocument();
    expect(getAllByText('Not Found')).toHaveLength(2);
  });

  it('should not display modal if docker versions are set', () => {
    const { queryByText } = renderComponent('1.2.3', '4.5.6');
    expect(queryByText('Docker Not Detected')).toBeNull();
  });

  it('should display modal if docker version is not set', () => {
    const { getByText } = renderComponent('', '1.2.3');
    expect(getByText('Docker Not Detected')).toBeInTheDocument();
    expect(getByText('1.2.3')).toBeInTheDocument();
  });

  it('should display modal if compose version is not set', () => {
    const { getByText } = renderComponent('1.2.3');
    expect(getByText('Docker Not Detected')).toBeInTheDocument();
    expect(getByText('1.2.3')).toBeInTheDocument();
  });

  it('should display download button for mac', () => {
    mockProperty(system, 'platform', 'mac');
    const { getByText, getByLabelText } = renderComponent();
    expect(getByText('Download Docker Desktop')).toBeInTheDocument();
    expect(getByLabelText('icon: apple')).toBeInTheDocument();
  });

  it('should open browser when download button clicked on mac', () => {
    shell.openExternal = jest.fn().mockResolvedValue(true);
    mockProperty(system, 'platform', 'mac');
    const { getByText } = renderComponent();
    fireEvent.click(getByText('Download Docker Desktop'));
    expect(shell.openExternal).toBeCalledTimes(1);
    expect(shell.openExternal).toBeCalledWith(dockerLinks.mac['Docker Desktop']);
  });

  it('should display download button for windows', () => {
    mockProperty(system, 'platform', 'windows');
    const { getByText, getByLabelText } = renderComponent();
    expect(getByText('Download Docker Desktop')).toBeInTheDocument();
    expect(getByLabelText('icon: windows')).toBeInTheDocument();
  });

  it('should open browser when download button clicked on windows', () => {
    shell.openExternal = jest.fn().mockResolvedValue(true);
    mockProperty(system, 'platform', 'windows');
    const { getByText } = renderComponent();
    fireEvent.click(getByText('Download Docker Desktop'));
    expect(shell.openExternal).toBeCalledTimes(1);
    expect(shell.openExternal).toBeCalledWith(dockerLinks.windows['Docker Desktop']);
  });

  it('should display download button for linux', () => {
    mockProperty(system, 'platform', 'linux');
    const { getByText, getAllByLabelText } = renderComponent();
    expect(getByText('Download Docker')).toBeInTheDocument();
    expect(getByText('Download Docker Compose')).toBeInTheDocument();
    expect(getAllByLabelText('icon: download')).toHaveLength(2);
  });

  it('should open browser when download buttons clicked on linux', () => {
    shell.openExternal = jest.fn().mockResolvedValue(true);
    mockProperty(system, 'platform', 'linux');
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
