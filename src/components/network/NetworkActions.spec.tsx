import React from 'react';
import { renderWithProviders } from 'utils/tests';
import { Status } from 'types';
import NetworkActions from './NetworkActions';

describe('NetworkActions Component', () => {
  const renderComponent = (status: Status) => {
    return renderWithProviders(<NetworkActions status={status} />);
  };

  it('should render the Starting status', () => {
    const { getByText } = renderComponent(Status.Starting);
    expect(getByText('Starting')).toBeTruthy();
    // button should be loading
    expect(getByText('Starting').parentElement).toHaveClass('ant-btn-loading');
  });

  it('should render the Started status', () => {
    const { getByText } = renderComponent(Status.Started);
    expect(getByText('Stop')).toBeTruthy();
    // button should not be loading
    expect(getByText('Stop').parentElement).not.toHaveClass('ant-btn-loading');
  });

  it('should render the Stopping status', () => {
    const { getByText } = renderComponent(Status.Stopping);
    expect(getByText('Stopping')).toBeTruthy();
    // button should be loading
    expect(getByText('Stopping').parentElement).toHaveClass('ant-btn-loading');
  });

  it('should render the Stopped status', () => {
    const { getByText } = renderComponent(Status.Stopped);
    expect(getByText('Start')).toBeTruthy();
    // button should be loading
    expect(getByText('Start').parentElement).not.toHaveClass('ant-btn-loading');
  });

  it('should render the Error status', () => {
    const { getByText } = renderComponent(Status.Error);
    expect(getByText('Restart')).toBeTruthy();
    // button should be loading
    expect(getByText('Restart').parentElement).not.toHaveClass('ant-btn-loading');
  });
});
