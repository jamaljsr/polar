import React from 'react';
import { render } from '@testing-library/react';
import Loader from './Loader';

describe('Loader Component', () => {
  const renderComponent = (inline?: boolean, size?: string) => {
    return render(<Loader inline={inline} size={size} />);
  };

  it('should have default styles', () => {
    const { getByTestId } = renderComponent();
    expect(getByTestId('loader')).toHaveStyle(`font-size: 2rem;`);
    expect(getByTestId('loader')).toHaveStyle(`position: absolute;`);
    expect(getByTestId('loader')).toHaveStyle(`top: 50%;`);
    expect(getByTestId('loader')).toHaveStyle(`left: 50%;`);
    expect(getByTestId('loader')).toHaveStyle(`transform: translate(-50%, -50%);`);
  });

  it('should render inline', () => {
    const { getByTestId } = renderComponent(true);
    expect(getByTestId('loader')).not.toHaveStyle(`position: absolute;`);
    expect(getByTestId('loader')).not.toHaveStyle(`top: 50%;`);
    expect(getByTestId('loader')).not.toHaveStyle(`left: 50%;`);
    expect(getByTestId('loader')).not.toHaveStyle(`transform: translate(-50%, -50%);`);
  });

  it('should use the correct size', () => {
    const { getByTestId } = renderComponent(false, '3rem');
    expect(getByTestId('loader')).toHaveStyle(`font-size: 3rem;`);
  });
});
