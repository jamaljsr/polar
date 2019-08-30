import React from 'react';
import { Status } from 'types';
import { renderWithProviders } from 'utils/tests';
import StatusTag from './StatusTag';

describe('StatusTag Component', () => {
  const renderComponent = (status: Status) => {
    return renderWithProviders(<StatusTag status={status} />);
  };

  it('should render the Starting status', () => {
    const { getByTestId } = renderComponent(Status.Starting);
    expect(getByTestId('tag')).toHaveTextContent('cmps.status-tag.status-starting');
  });

  it('should render the Started status', () => {
    const { getByTestId } = renderComponent(Status.Started);
    expect(getByTestId('tag')).toHaveTextContent('cmps.status-tag.status-started');
  });

  it('should render the Stopping status', () => {
    const { getByTestId } = renderComponent(Status.Stopping);
    expect(getByTestId('tag')).toHaveTextContent('cmps.status-tag.status-stopping');
  });

  it('should render the Stopped status', () => {
    const { getByTestId } = renderComponent(Status.Stopped);
    expect(getByTestId('tag')).toHaveTextContent('cmps.status-tag.status-stopped');
  });

  it('should render the Error status', () => {
    const { getByTestId } = renderComponent(Status.Error);
    expect(getByTestId('tag')).toHaveTextContent('cmps.status-tag.status-error');
  });
});
