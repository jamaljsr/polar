import React from 'react';
import { fireEvent } from '@testing-library/dom';
import { renderWithProviders } from 'utils/tests';
import { NETWORK_NEW } from 'components/routing';
import NavMenu from './NavMenu';

describe('DetailsList Component', () => {
  const renderComponent = () => {
    return renderWithProviders(<NavMenu />);
  };

  it('should navigate to /network when create menu item clicked', () => {
    const { getByText, history } = renderComponent();
    fireEvent.click(getByText('Create Network'));
    expect(history.location.pathname).toEqual(NETWORK_NEW);
  });
});
