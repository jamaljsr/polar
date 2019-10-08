import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import CopyableInput from './CopyableInput';

describe('CopyableInput component', () => {
  const renderComponent = (label?: string) => {
    return render(<CopyableInput value="test" label={label} />);
  };

  it('should display a copy icon', () => {
    const { getByLabelText } = renderComponent();
    expect(getByLabelText('icon: copy')).toBeInTheDocument();
  });

  it('should display a message when the icon is clicked', async () => {
    const { findByText, getByLabelText } = renderComponent();
    fireEvent.click(getByLabelText('icon: copy'));
    expect(await findByText('Copied to clipboard')).toBeInTheDocument();
  });

  it('should display a message with label when the icon is clicked', async () => {
    const { findByText, getByLabelText } = renderComponent('test-label');
    fireEvent.click(getByLabelText('icon: copy'));
    expect(await findByText('Copied test-label to clipboard')).toBeInTheDocument();
  });
});
