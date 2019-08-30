import React from 'react';
import { renderWithProviders } from 'utils/tests';
import DetailsList from './DetailsList';

describe('DetailsList Component', () => {
  const renderComponent = () => {
    const details = [
      { label: 'd1', value: 'v1' },
      { label: 'd2', value: 'v2' },
      { label: 'd3', value: 'v3' },
    ];
    return renderWithProviders(<DetailsList details={details} />);
  };

  it('should render all the details', () => {
    const { getByText } = renderComponent();
    expect(getByText('d1')).toBeInTheDocument();
    expect(getByText('d2')).toBeInTheDocument();
    expect(getByText('d3')).toBeInTheDocument();
    expect(getByText('v1')).toBeInTheDocument();
    expect(getByText('v2')).toBeInTheDocument();
    expect(getByText('v3')).toBeInTheDocument();
  });
});
