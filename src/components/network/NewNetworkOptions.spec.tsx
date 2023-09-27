import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react';
import { Form } from 'antd';
import { renderWithProviders } from 'utils/tests';
import NewNetworkOptions from './NewNetworkOptions'; // Adjust the import as per your project structure

describe('NewNetworkOptions', () => {
  const mockSetIsDockerNetworkNameValid = jest.fn;
  const initialState = {
    network: {
      networks: [],
    },
  };
  const renderComponent = () => {
    const result = renderWithProviders(
      <Form>
        <NewNetworkOptions
          setIsDockerNetworkNameValid={mockSetIsDockerNetworkNameValid}
        />
      </Form>,
      { initialState },
    );
    return result;
  };

  it('renders without crashing', () => {
    const { getByText } = renderComponent();
    expect(getByText('Advanced Options')).toBeInTheDocument();
  });

  it('should expand and collapsed', async () => {
    const { getByText, queryByText, container } = renderComponent();
    await waitFor(() => {
      const result = queryByText('External Docker Network');
      expect(result).not.toBeInTheDocument();
    });
    const panel = getByText('Advanced Options') as HTMLElement;
    fireEvent.click(panel);

    await waitFor(() => {
      const result = queryByText('External Docker Network');
      expect(result).toBeInTheDocument();
    });
    fireEvent.click(panel);
    await waitFor(() => {
      const element = container.querySelector('.ant-collapse-content-hidden');
      expect(element).toBeInTheDocument();
    });
  });
});
