import React from 'react';
import { fireEvent } from '@testing-library/react';
import { createMemoryHistory } from 'history';
import { renderWithProviders } from 'utils/tests';
import { NETWORK_IMPORT } from 'components/routing';
import ImportNetwork from './ImportNetwork';

describe('ImportNetwork component', () => {
  beforeEach(jest.useFakeTimers);
  afterEach(jest.useRealTimers);

  const renderComponent = () => {
    const history = createMemoryHistory({ initialEntries: [NETWORK_IMPORT] });
    const location = { pathname: NETWORK_IMPORT, search: '', hash: '', state: undefined };
    const match = { isExact: true, path: '', url: NETWORK_IMPORT, params: {} };
    const cmp = <ImportNetwork history={history} location={location} match={match} />;
    const result = renderWithProviders(cmp, { route: NETWORK_IMPORT });
    return { ...result };
  };

  it('has a file uploader', async () => {
    const { getByText } = renderComponent();
    expect(
      getByText(
        'Drag a zip file exported from Polar here, or click to browse for the file',
      ),
    ).toBeInTheDocument();
  });

  it('should navigate home when back button clicked', () => {
    const { getByLabelText, history } = renderComponent();
    const backBtn = getByLabelText('Back');
    expect(backBtn).toBeInTheDocument();
    fireEvent.click(backBtn);
    expect(history.location.pathname).toEqual('/');
  });
});
