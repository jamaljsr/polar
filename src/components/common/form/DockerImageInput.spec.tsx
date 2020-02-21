import React from 'react';
import { fireEvent } from '@testing-library/react';
import { DOCKER_REPO } from 'utils/constants';
import { renderWithProviders } from 'utils/tests';
import DockerImageInput from './DockerImageInput';

describe('DockerImageInput', () => {
  const renderComponent = () => {
    const initialState = {
      app: {
        dockerImages: ['aaa', 'bbb', `${DOCKER_REPO}/lnd`],
      },
    };
    const cmp = <DockerImageInput name="image" label="Docker Image" />;
    const result = renderWithProviders(cmp, { initialState, wrapForm: true });
    return {
      ...result,
    };
  };

  it('should display the label and input', () => {
    const { getByText, getByLabelText } = renderComponent();
    expect(getByText('Docker Image')).toBeInTheDocument();
    expect(getByLabelText('Docker Image')).toBeInTheDocument();
    expect(getByLabelText('Docker Image')).toBeInstanceOf(HTMLInputElement);
  });

  it('should filter images based on search text', async () => {
    const { getAllByText, queryAllByText, getByLabelText } = renderComponent();
    const input = getByLabelText('Docker Image') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'a' } });
    expect(getAllByText('aaa')).toHaveLength(2);
    expect(queryAllByText('bbb')).toHaveLength(0);
    expect(queryAllByText(`${DOCKER_REPO}/lnd`)).toHaveLength(0);
    fireEvent.change(input, { target: { value: '' } });
    expect(getAllByText('aaa')).toHaveLength(2);
    expect(getAllByText('bbb')).toHaveLength(1);
    expect(queryAllByText(`${DOCKER_REPO}/lnd`)).toHaveLength(0);
  });
});
