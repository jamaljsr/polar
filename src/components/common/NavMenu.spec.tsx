import React from 'react';
import { fireEvent } from '@testing-library/dom';
import { renderWithProviders } from 'utils/tests';
import { NETWORK_NEW, NODES_VIEW } from 'components/routing';
import NavMenu from './NavMenu';

describe('DetailsList Component', () => {
  const renderComponent = () => {
    return renderWithProviders(<NavMenu />);
  };

  it('should navigate to /network when create menu item clicked', () => {
    const { getByText, getByLabelText, history } = renderComponent();
    fireEvent.click(getByLabelText('menu'));
    fireEvent.click(getByText('Create Network'));
    expect(history.location.pathname).toEqual(NETWORK_NEW);
  });

  it('should navigate to /nodes when manage nodes item clicked', () => {
    const { getByText, getByLabelText, history } = renderComponent();
    fireEvent.click(getByLabelText('menu'));
    fireEvent.click(getByText('Manage Nodes'));
    expect(history.location.pathname).toEqual(NODES_VIEW);
  });
});
