import React from 'react';
import { Status } from 'shared/types';
import { renderWithProviders } from 'utils/tests';
import StatusTag from './StatusTag';

describe('StatusBadge Component', () => {
  const renderComponent = (status: Status) => {
    return renderWithProviders(<StatusTag status={status} />);
  };

  it('should render the Starting status', () => {
    const { getByText } = renderComponent(Status.Starting);
    expect(getByText('Starting')).toBeInTheDocument();
  });

  it('should render the Started status', () => {
    const { getByText } = renderComponent(Status.Started);
    expect(getByText('Started')).toBeInTheDocument();
  });

  it('should render the Stopping status', () => {
    const { getByText } = renderComponent(Status.Stopping);
    expect(getByText('Stopping')).toBeInTheDocument();
  });

  it('should render the Stopped status', () => {
    const { getByText } = renderComponent(Status.Stopped);
    expect(getByText('Stopped')).toBeInTheDocument();
  });

  it('should render the Error status', () => {
    const { getByText } = renderComponent(Status.Error);
    expect(getByText('Error')).toBeInTheDocument();
  });
});
