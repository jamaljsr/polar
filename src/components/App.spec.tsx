import React from 'react';
import { render, wait } from '@testing-library/react';
import App from './App';

describe('App Component', () => {
  it('renders without crashing', async () => {
    const { getByText } = render(<App />);
    await wait(() => {
      expect(getByText('Polar')).toBeInTheDocument();
    });
  });
});
