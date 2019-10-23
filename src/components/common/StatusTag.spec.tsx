import React from 'react';
import { render } from '@testing-library/react';
import { Status } from 'shared/types';
import StatusBadge from './StatusBadge';

describe('StatusTag Component', () => {
  const renderComponent = (status: Status, text?: string) => {
    const result = render(<StatusBadge status={status} text={text} />);
    return {
      ...result,
      dot: result.container.querySelector('.ant-badge span:first-child'),
    };
  };

  it('should render the text', () => {
    const { getByText } = renderComponent(Status.Starting, 'test text');
    expect(getByText('test text')).toBeInTheDocument();
  });

  it('should render the Starting status', () => {
    const { dot } = renderComponent(Status.Starting);
    expect(dot).toHaveClass('ant-badge-status-processing');
  });

  it('should render the Started status', () => {
    const { dot } = renderComponent(Status.Started);
    expect(dot).toHaveClass('ant-badge-status-success');
  });

  it('should render the Stopping status', () => {
    const { dot } = renderComponent(Status.Stopping);
    expect(dot).toHaveClass('ant-badge-status-processing');
  });

  it('should render the Stopped status', () => {
    const { dot } = renderComponent(Status.Stopped);
    expect(dot).toHaveClass('ant-badge-status-default');
  });

  it('should render the Error status', () => {
    const { dot } = renderComponent(Status.Error);
    expect(dot).toHaveClass('ant-badge-status-error');
  });
});
