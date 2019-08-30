import React from 'react';
import { fireEvent } from '@testing-library/dom';
import { render } from '@testing-library/react';
import { Status } from 'types';
import NetworkActions from './NetworkActions';

describe('NetworkActions Component', () => {
  const handleClick = jest.fn();

  const renderComponent = (status: Status) => {
    return render(<NetworkActions status={status} onClick={handleClick} />);
  };

  it('should render the Starting status', () => {
    const { getByText } = renderComponent(Status.Starting);
    const primaryBtn = getByText('cmps.network-actions.primary-btn-starting');
    expect(primaryBtn).toBeInTheDocument();
    expect(primaryBtn.parentElement).toHaveClass('ant-btn-loading');
  });

  it('should render the Started status', () => {
    const { getByText } = renderComponent(Status.Started);
    const primaryBtn = getByText('cmps.network-actions.primary-btn-stop');
    expect(primaryBtn).toBeInTheDocument();
    expect(primaryBtn.parentElement).not.toHaveClass('ant-btn-loading');
  });

  it('should render the Stopping status', () => {
    const { getByText } = renderComponent(Status.Stopping);
    const primaryBtn = getByText('cmps.network-actions.primary-btn-stopping');
    expect(primaryBtn).toBeInTheDocument();
    expect(primaryBtn.parentElement).toHaveClass('ant-btn-loading');
  });

  it('should render the Stopped status', () => {
    const { getByText } = renderComponent(Status.Stopped);
    const primaryBtn = getByText('cmps.network-actions.primary-btn-start');
    expect(primaryBtn).toBeInTheDocument();
    expect(primaryBtn.parentElement).not.toHaveClass('ant-btn-loading');
  });

  it('should render the Error status', () => {
    const { getByText } = renderComponent(Status.Error);
    const primaryBtn = getByText('cmps.network-actions.primary-btn-restart');
    expect(primaryBtn).toBeInTheDocument();
    expect(primaryBtn.parentElement).not.toHaveClass('ant-btn-loading');
  });

  it('should call onClick when primary button pressed', () => {
    const { getByText } = renderComponent(Status.Stopped);
    const primaryBtn = getByText('cmps.network-actions.primary-btn-start');
    fireEvent.click(primaryBtn);
    expect(handleClick).toBeCalled();
  });
});
