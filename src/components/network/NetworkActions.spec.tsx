import React from 'react';
import { renderWithProviders } from 'utils/tests';
import { Status } from 'types';
import NetworkActions from './NetworkActions';
import { fireEvent } from '@testing-library/dom';

describe('NetworkActions Component', () => {
  const handleClick = jest.fn();

  const renderComponent = (status: Status) => {
    return renderWithProviders(<NetworkActions status={status} onClick={handleClick} />);
  };

  it('should render the Starting status', () => {
    const { getByText } = renderComponent(Status.Starting);
    const primaryBtn = getByText('cmps.network-actions.primary-btn-starting');
    expect(primaryBtn).toBeTruthy();
    expect(primaryBtn.parentElement).toHaveClass('ant-btn-loading');
  });

  it('should render the Started status', () => {
    const { getByText } = renderComponent(Status.Started);
    const primaryBtn = getByText('cmps.network-actions.primary-btn-stop');
    expect(primaryBtn).toBeTruthy();
    expect(primaryBtn.parentElement).not.toHaveClass('ant-btn-loading');
  });

  it('should render the Stopping status', () => {
    const { getByText } = renderComponent(Status.Stopping);
    const primaryBtn = getByText('cmps.network-actions.primary-btn-stopping');
    expect(primaryBtn).toBeTruthy();
    expect(primaryBtn.parentElement).toHaveClass('ant-btn-loading');
  });

  it('should render the Stopped status', () => {
    const { getByText } = renderComponent(Status.Stopped);
    const primaryBtn = getByText('cmps.network-actions.primary-btn-start');
    expect(primaryBtn).toBeTruthy();
    expect(primaryBtn.parentElement).not.toHaveClass('ant-btn-loading');
  });

  it('should render the Error status', () => {
    const { getByText } = renderComponent(Status.Error);
    const primaryBtn = getByText('cmps.network-actions.primary-btn-restart');
    expect(primaryBtn).toBeTruthy();
    expect(primaryBtn.parentElement).not.toHaveClass('ant-btn-loading');
  });

  it('should call onClick when primary button pressed', () => {
    const { getByText } = renderComponent(Status.Stopped);
    const primaryBtn = getByText('cmps.network-actions.primary-btn-start');
    fireEvent.click(primaryBtn);
    expect(handleClick).toBeCalled();
  });
});
