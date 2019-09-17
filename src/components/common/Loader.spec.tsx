import React from 'react';
import { render } from '@testing-library/react';
import Loader from './Loader';

describe('Loader Component', () => {
  const renderComponent = (inline?: boolean, size?: string) => {
    const result = render(<Loader inline={inline} size={size} />);
    return {
      ...result,
      loader: result.getByLabelText('icon: loading'),
    };
  };

  it('should have default styles', () => {
    const { loader } = renderComponent();
    expect(loader).toHaveStyle(`font-size: 2rem;`);
    expect(loader).toHaveStyle(`position: absolute;`);
    expect(loader).toHaveStyle(`top: 50%;`);
    expect(loader).toHaveStyle(`left: 50%;`);
    expect(loader).toHaveStyle(`transform: translate(-50%, -50%);`);
  });

  it('should render inline', () => {
    const { loader } = renderComponent(true);
    expect(loader).not.toHaveStyle(`position: absolute;`);
    expect(loader).not.toHaveStyle(`top: 50%;`);
    expect(loader).not.toHaveStyle(`left: 50%;`);
    expect(loader).not.toHaveStyle(`transform: translate(-50%, -50%);`);
  });

  it('should use the correct size', () => {
    const { loader } = renderComponent(false, '3rem');
    expect(loader).toHaveStyle(`font-size: 3rem;`);
  });
});
