import React from 'react';
import { act, fireEvent } from '@testing-library/react';
import { Form } from 'antd';
import { injections, renderWithProviders } from 'utils/tests';
import DockerNetworkName from './DockerNetworkName';

// Mock the useStoreActions hook
const mockDockerService = injections.dockerService as jest.Mocked<
  typeof injections.dockerService
>;

describe('DockerNetworkName', () => {
  let unmount: () => void;
  let result: any;
  const mockValidateCallback = jest.fn();

  const renderComponent = async () => {
    await act(async () => {
      result = renderWithProviders(
        <Form>
          <DockerNetworkName name="network" validateCallback={mockValidateCallback} />
        </Form>,
      );
      unmount = result.unmount;
      //return result;
    });
  };

  beforeEach(() => {
    mockDockerService.getDockerExternalNetworks.mockResolvedValue([
      'test-network',
      'test-network-2',
    ]);
  });

  afterEach(() => unmount());

  describe('When the modal renders', () => {
    it('should display External Docker Network label', async () => {
      await renderComponent();
      const { getByText } = result;
      expect(getByText('External Docker Network')).toBeInTheDocument();
      expect(getByText('Select a network leave blank to clear')).toBeInTheDocument();
    });

    it('should fetch external docker networks on mount', async () => {
      await renderComponent();
      expect(mockDockerService.getDockerExternalNetworks).toHaveBeenCalledTimes(1);
    });
  });

  describe('When the form item validates', () => {
    it('should show help message for creating an external docker network', async () => {
      await renderComponent();

      const { getByLabelText, findByText, container } = result;
      const input = getByLabelText('External Docker Network') as HTMLInputElement;
      fireEvent.change(input, { target: { value: 'test-network-3' } });
      expect(
        await findByText('Docker External Network will be created'),
      ).toBeInTheDocument();
      expect(mockValidateCallback).toHaveBeenCalledWith(true);
      const element = container.querySelector('.ant-select.ant-select-status-warning');
      expect(element).not.toBeNull();
    });

    it('should show help message for attaching to a external docker network', async () => {
      await renderComponent();
      const { getByLabelText, getByText, findByText, container } = result;

      expect(getByText('External Docker Network')).toBeInTheDocument();
      expect(getByLabelText('External Docker Network')).toBeInstanceOf(HTMLInputElement);
      const input = getByLabelText('External Docker Network') as HTMLInputElement;
      fireEvent.change(input, { target: { value: 'test-network' } });
      expect(
        await findByText('Docker Network will be attached to test-network'),
      ).toBeInTheDocument();
      expect(mockValidateCallback).toHaveBeenCalledWith(true);
      fireEvent.change(input, { target: { value: 'test-network-2' } });
      expect(
        await findByText('Docker Network will be attached to test-network-2'),
      ).toBeInTheDocument();
      expect(mockValidateCallback).toHaveBeenCalledWith(true);
      const element = container.querySelector('.ant-select.ant-select-status-success');
      expect(element).not.toBeNull();
    });

    it('should show help message for an invalid docker network name', async () => {
      await renderComponent();

      const { getByLabelText, findByText, container } = result;
      const input = getByLabelText('External Docker Network') as HTMLInputElement;
      fireEvent.change(input, { target: { value: '__' } });
      expect(await findByText('Invalid Docker Network Name')).toBeInTheDocument();
      expect(mockValidateCallback).toHaveBeenCalledWith(false);
      const element = container.querySelector('.ant-select.ant-select-status-error');
      expect(element).not.toBeNull();
    });

    it('should show help message for clearing the external network', async () => {
      await renderComponent();

      const { getByLabelText, findByText, container } = result;
      const input = getByLabelText('External Docker Network') as HTMLInputElement;

      fireEvent.change(input, { target: { value: 'default' } });
      expect(await findByText('Docker Network will be cleared')).toBeInTheDocument();

      fireEvent.change(input, { target: { value: '' } });
      expect(await findByText('Docker Network will be cleared')).toBeInTheDocument();

      const element = container.querySelector('.ant-select.ant-select-status-success');
      expect(element).not.toBeNull();
    });
  });

  // Add more test cases as needed
});
