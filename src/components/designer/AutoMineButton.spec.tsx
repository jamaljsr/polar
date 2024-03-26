import React from 'react';
import { fireEvent } from '@testing-library/dom';
import { getNetwork, renderWithProviders } from 'utils/tests';
import AutoMineButton from './AutoMineButton';
import { AutoMineMode } from 'types';
import { AutoMinerModel } from 'store/models/network';
import { Status } from 'shared/types';

describe('AutoMineButton', () => {
  let unmount: () => void;

  const renderComponent = (autoMineMode: AutoMineMode = AutoMineMode.AutoOff) => {
    const network = getNetwork(1, 'test network', Status.Started.toString());
    network.autoMineMode = autoMineMode;

    const autoMiner = {
      startTime: 0,
      timer: undefined,
      mining: false,
    } as AutoMinerModel;

    if (autoMineMode != AutoMineMode.AutoOff) {
      // set start time into the past to test the percentage of the timer
      autoMiner.startTime = Date.now() - 15000;
      autoMiner.mining = true;
    }

    const initialState = {
      network: {
        networks: [network],
        designer: {
          activeId: network.id,
        },
        autoMiners: {
          '1': autoMiner,
        },
      },
    };
    const cmp = <AutoMineButton network={network}></AutoMineButton>;
    const result = renderWithProviders(cmp, { initialState });
    unmount = result.unmount;
    return result;
  };

  afterEach(() => unmount());

  it('should display the button text', async () => {
    const { getByText } = renderComponent();
    expect(getByText('Auto Mine: Off')).toBeInTheDocument();
  });

  it('should display dropdown options', async () => {
    const { getByText, findByText } = renderComponent();
    fireEvent.mouseOver(getByText('Auto Mine: Off'));
    expect(await findByText('30s')).toBeInTheDocument();
    expect(await findByText('1m')).toBeInTheDocument();
    expect(await findByText('5m')).toBeInTheDocument();
    expect(await findByText('10m')).toBeInTheDocument();
  });

  it('should display correct automine mode based on network', async () => {
    const { getByText } = renderComponent(AutoMineMode.Auto30s);
    expect(getByText('Auto Mine: 30s')).toBeInTheDocument();
  });

  it('should calculate remaining percentage correctly', async () => {
    jest.useFakeTimers({ now: Date.now() });

    const { findByText } = renderComponent(AutoMineMode.Auto30s);

    // advance by one interval
    jest.advanceTimersByTime(1500);

    const progressBar = (await findByText('Auto Mine: 30s'))
      .nextElementSibling as HTMLElement;

    const progressBarWidthPercentage = parseFloat(progressBar.style.width.slice(0, -1));
    expect(progressBarWidthPercentage).toBeGreaterThan(49.0);
    expect(progressBarWidthPercentage).toBeLessThan(51.0);

    jest.useRealTimers();
  });

  it('should change remaining percentage on mode change', async () => {
    const { getByText, findByText } = renderComponent();

    let progressBar = getByText('Auto Mine: Off').nextElementSibling as HTMLElement;
    expect(progressBar.style.width).toBe('0%');

    // click to start automine
    fireEvent.mouseOver(getByText('Auto Mine: Off'));
    fireEvent.click(await findByText('30s'));
    // the button text doesn't change since the autoMine store action is not really run
    progressBar = getByText('Auto Mine: Off').nextElementSibling as HTMLElement;
    expect(progressBar.style.width).toBe('100%');

    // click again to turn off automine
    fireEvent.mouseOver(getByText('Auto Mine: Off'));
    fireEvent.click(await findByText('Off'));
    progressBar = getByText('Auto Mine: Off').nextElementSibling as HTMLElement;
    expect(progressBar.style.width).toBe('0%');
  });
});
