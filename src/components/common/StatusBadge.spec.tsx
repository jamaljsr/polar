import React from 'react';
import { renderWithProviders } from 'utils/tests';
import { Status } from 'types';
import StatusTag from './StatusTag';

describe('StatusTag Component', () => {
  const renderComponent = (status: Status) => {
    return renderWithProviders(<StatusTag status={status} />);
  };

  it('should render the Starting status', () => {
    const { getByTestId } = renderComponent(Status.Starting);
    expect(getByTestId('tag')).toHaveTextContent('Starting');
  });

  it('should render the Started status', () => {
    const { getByTestId } = renderComponent(Status.Started);
    expect(getByTestId('tag')).toHaveTextContent('Started');
  });

  it('should render the Stopping status', () => {
    const { getByTestId } = renderComponent(Status.Stopping);
    expect(getByTestId('tag')).toHaveTextContent('Stopping');
  });

  it('should render the Stopped status', () => {
    const { getByTestId } = renderComponent(Status.Stopped);
    expect(getByTestId('tag')).toHaveTextContent('Stopped');
  });

  it('should render the Error status', () => {
    const { getByTestId } = renderComponent(Status.Error);
    expect(getByTestId('tag')).toHaveTextContent('Error');
  });
});
