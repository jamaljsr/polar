import React from 'react';
import { fireEvent } from '@testing-library/dom';
import { Status } from 'shared/types';
import { initChartFromNetwork } from 'utils/chart';
import { getNetwork, renderWithProviders } from 'utils/tests';
import { NETWORK_VIEW } from 'components/routing';
import NetworkCard from './NetworkCard';

describe('NetworkCard component', () => {
  const network = getNetwork(1, 'my network 1', Status.Stopped, 4, 'network description');
  const renderComponent = () => {
    const initialState = {
      network: {
        networks: [network],
      },
      designer: {
        allCharts: {
          1: initChartFromNetwork(network),
        },
      },
    };
    return renderWithProviders(<NetworkCard network={network} />, { initialState });
  };

  it("should display the network's name", () => {
    const { getByText } = renderComponent();
    expect(getByText('my network 1')).toBeInTheDocument();
  });

  it("should display the tooltip for the network's description", async () => {
    const { getByLabelText, findByText } = renderComponent();
    const infoIcon = getByLabelText('info-circle');
    fireEvent.mouseOver(infoIcon);
    const tooltipElement = await findByText('network description');
    expect(tooltipElement).toBeInTheDocument();
  });

  it('should display the number of lightning and tap nodes', () => {
    const { getAllByText } = renderComponent();
    expect(getAllByText('4')).toHaveLength(2);
  });

  it('should display the number of bitcoin nodes', () => {
    const { getByText } = renderComponent();
    expect(getByText('1')).toBeInTheDocument();
  });

  it('should navigate to the network view screen when clicked', () => {
    const { getByText, history } = renderComponent();
    fireEvent.click(getByText('my network 1'));
    expect(history.location.pathname).toEqual(NETWORK_VIEW(network.id));
  });
});
