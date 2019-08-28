import React from 'react';
import { render } from '@testing-library/react';
import { Status } from 'types';
import StatusBadge from './StatusBadge';

describe('StatusBadge Component', () => {
  const renderComponent = (status: Status, text?: string) => {
    return render(<StatusBadge status={status} text={text} />);
  };

  it('should render the text', () => {
    const { getByText } = renderComponent(Status.Starting, 'test text');
    expect(getByText('test text')).toBeInTheDocument();
  });

  it('should render the Starting status', () => {
    const { getByTestId } = renderComponent(Status.Starting);
    expect(getByTestId('badge').firstChild).toHaveClass('ant-badge-status-processing');
  });

  it('should render the Started status', () => {
    const { getByTestId } = renderComponent(Status.Started);
    expect(getByTestId('badge').firstChild).toHaveClass('ant-badge-status-success');
  });

  it('should render the Stopping status', () => {
    const { getByTestId } = renderComponent(Status.Stopping);
    expect(getByTestId('badge').firstChild).toHaveClass('ant-badge-status-processing');
  });

  it('should render the Stopped status', () => {
    const { getByTestId } = renderComponent(Status.Stopped);
    expect(getByTestId('badge').firstChild).toHaveClass('ant-badge-status-default');
  });

  it('should render the Error status', () => {
    const { getByTestId } = renderComponent(Status.Error);
    expect(getByTestId('badge').firstChild).toHaveClass('ant-badge-status-error');
  });
});
