import React from 'react';
import { Status } from 'shared/types';
import { renderWithProviders } from 'utils/tests';
import StatusTag from './StatusTag';

describe('StatusTag Component', () => {
  const renderComponent = (status: Status) => {
    const result = renderWithProviders(<StatusTag status={status} />);
    return {
      ...result,
      dot: result.container.querySelector('.ant-tag'),
    };
  };

  it('should render the Starting status', () => {
    const { dot } = renderComponent(Status.Starting);
    expect(dot).toHaveClass('ant-tag-blue');
  });

  it('should render the Started status', () => {
    const { dot } = renderComponent(Status.Started);
    expect(dot).toHaveClass('ant-tag-green');
  });

  it('should render the Stopping status', () => {
    const { dot } = renderComponent(Status.Stopping);
    expect(dot).toHaveClass('ant-tag-blue');
  });

  it('should render the Stopped status', () => {
    const { dot } = renderComponent(Status.Stopped);
    expect(dot).toHaveClass('ant-tag-red');
  });

  it('should render the Error status', () => {
    const { dot } = renderComponent(Status.Error);
    expect(dot).toHaveClass('ant-tag-red');
  });
});
