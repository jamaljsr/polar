import React from 'react';
import { fireEvent } from '@testing-library/dom';
import { renderWithProviders } from 'utils/tests';
import { NETWORK } from 'components/routing';
import NavMenu from './NavMenu';

describe('DetailsList Component', () => {
  const renderComponent = () => {
    const rendered = renderWithProviders(<NavMenu />);
    const icon = rendered.container.querySelector('[data-icon=menu]') as Element;
    return {
      ...rendered,
      icon,
    };
  };

  it('should display the hamburger menu icon', () => {
    const { icon } = renderComponent();
    expect(icon).toBeInTheDocument();
  });

  it('should display the dropdown when clcked', () => {
    const { icon, getByText } = renderComponent();
    fireEvent.click(icon);
    expect(getByText('Create Network')).toBeInTheDocument();
  });

  it('should navigate to /network when create menu item clicked', () => {
    const { icon, getByText, history } = renderComponent();
    fireEvent.click(icon);
    fireEvent.click(getByText('Create Network'));
    expect(history.location.pathname).toEqual(NETWORK);
  });
});
