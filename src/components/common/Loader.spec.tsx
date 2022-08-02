import React from 'react';
import { render } from '@testing-library/react';
import Loader from './Loader';

describe('Loader Component', () => {
  const renderComponent = (inline?: boolean, size?: number) => {
    const result = render(<Loader inline={inline} size={size} />);
    return {
      ...result,
      loader: result.getByLabelText('loading'),
    };
  };

  it('should have default styles', () => {
    const { loader } = renderComponent();
    expect(loader).toHaveStyle(`font-size: 2rem;`);
    expect(loader).toHaveStyle(`position: absolute;`);
    expect(loader).toHaveStyle(`top: 50%;`);
    expect(loader).toHaveStyle(`left: 50%;`);
    expect(loader).toHaveStyle(`margin-top: -1rem;`);
    expect(loader).toHaveStyle(`margin-left: -1rem;`);
  });

  it('should render inline', () => {
    const { loader } = renderComponent(true);
    expect(loader).not.toHaveStyle(`position: absolute;`);
    expect(loader).not.toHaveStyle(`top: 50%;`);
    expect(loader).not.toHaveStyle(`left: 50%;`);
    expect(loader).not.toHaveStyle(`margin-top: -1rem;`);
    expect(loader).not.toHaveStyle(`margin-left: -1rem;`);
  });

  it('should use the correct size', () => {
    const { loader } = renderComponent(false, 3);
    expect(loader).toHaveStyle(`font-size: 3rem;`);
  });
});
