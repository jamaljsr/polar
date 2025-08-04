import React from 'react';
import { Status } from 'shared/types';
import { renderWithProviders } from 'utils/tests';
import StatusButton from './StatusButton';

describe('StatusButton Component', () => {
  const renderComponent = (status: Status) =>
    renderWithProviders(<StatusButton status={status} onClick={() => ''} />);

  it('should render starting button', () => {
    const { getByText } = renderComponent(Status.Starting);
    expect(getByText('Starting')).toBeInTheDocument();
  });

  it('should render started button', () => {
    const { getByText } = renderComponent(Status.Started);
    expect(getByText('Stop')).toBeInTheDocument();
  });

  it('should render stopping button', () => {
    const { getByText } = renderComponent(Status.Stopping);
    expect(getByText('Stopping')).toBeInTheDocument();
  });

  it('should render stopped button', () => {
    const { getByText } = renderComponent(Status.Stopped);
    expect(getByText('Start')).toBeInTheDocument();
  });

  it('should render error button', () => {
    const { getByText } = renderComponent(Status.Error);
    expect(getByText('Restart')).toBeInTheDocument();
  });
});
