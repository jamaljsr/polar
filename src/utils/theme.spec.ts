import React from 'react';
import { render } from '@testing-library/react';
import { changeTheme, DOM_ID } from './theme';

describe('Theme Util', () => {
  const createStyle = () => {
    const style = document.createElement('link');
    style.type = 'text/css';
    style.rel = 'stylesheet';
    style.id = DOM_ID;
    style.href = '/themes/dark.css';
    return style;
  };

  it('should change stylesheet', () => {
    const { container } = render(React.createElement('div'));
    container.append(createStyle());
    changeTheme('light');
    const style = container.querySelector('link') as HTMLLinkElement;
    expect(style.href).toMatch(/.*\/themes\/light.css/);
  });

  it('should not change theme if link tag is missing', () => {
    const { container } = render(React.createElement('div'));
    changeTheme('light');
    const style = container.querySelector('link') as HTMLLinkElement;
    expect(style).not.toBeInTheDocument();
  });
});
