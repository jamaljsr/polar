import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react';
import { Status } from 'shared/types';
import { initChartFromNetwork } from 'utils/chart';
import { getNetwork, injections, renderWithProviders } from 'utils/tests';
import AdvancedOptionsModal from './AdvancedOptionsModal';

const dockerServiceMock = injections.dockerService as jest.Mocked<
  typeof injections.dockerService
>;

describe('AdvancedOptionsModal', () => {
  let unmount: () => void;

  const renderComponent = async (status?: Status, nodeName = 'alice') => {
    const network = getNetwork(1, 'test network', status?.toString());
    const initialState = {
      network: {
        networks: [network],
      },
      designer: {
        activeId: network.id,
        allCharts: {
          [network.id]: initChartFromNetwork(network),
        },
      },
      modals: {
        advancedOptions: {
          visible: true,
          nodeName,
          defaultCommand: 'test command',
        },
      },
    };
    const cmp = <AdvancedOptionsModal network={network} />;
    const result = renderWithProviders(cmp, { initialState });
    unmount = result.unmount;
    return {
      ...result,
      network,
    };
  };

  afterEach(() => unmount());

  it('should render labels', async () => {
    const { getByText } = await renderComponent();
    expect(getByText('Docker Startup Command')).toBeInTheDocument();
  });

  it('should render form inputs', async () => {
    const { getByLabelText } = await renderComponent();
    expect(getByLabelText('Docker Startup Command')).toBeInTheDocument();
  });

  it('should render action icons', async () => {
    const { getByLabelText } = await renderComponent();
    expect(getByLabelText('align-left')).toBeInTheDocument();
    expect(getByLabelText('stop')).toBeInTheDocument();
  });

  it('should render button', async () => {
    const { getByText } = await renderComponent();
    const btn = getByText('Save');
    expect(btn).toBeInTheDocument();
    expect(btn.parentElement).toBeInstanceOf(HTMLButtonElement);
  });

  it('should hide modal when cancel is clicked', async () => {
    const { getByText, queryByText } = await renderComponent();
    const btn = getByText('Cancel');
    expect(btn).toBeInTheDocument();
    expect(btn.parentElement).toBeInstanceOf(HTMLButtonElement);
    fireEvent.click(getByText('Cancel'));
    expect(queryByText('Cancel')).not.toBeInTheDocument();
  });

  it('should do nothing if an invalid node name is used', async () => {
    const { getByText } = await renderComponent(Status.Stopped, 'invalid');
    fireEvent.click(getByText('Save'));
    await waitFor(() => {
      expect(getByText('Save')).toBeInTheDocument();
    });
  });

  describe('with form submitted', () => {
    it('should update the node command', async () => {
      const { getByText, getByLabelText, store } = await renderComponent();
      fireEvent.click(getByLabelText('align-left'));
      fireEvent.click(getByText('Save'));
      await waitFor(() => {
        expect(store.getState().modals.advancedOptions.visible).toBe(false);
        expect(
          store.getState().network.networks[0].nodes.lightning[0].docker.command,
        ).toBe('test command');
      });
      expect(getByText('Updated advanced options for alice')).toBeInTheDocument();
    });

    it('should display an error if it fails', async () => {
      dockerServiceMock.saveComposeFile.mockRejectedValue(new Error('test-error'));
      const { getByText, getByLabelText } = await renderComponent();
      fireEvent.click(getByLabelText('align-left'));
      fireEvent.click(getByText('Save'));
      await waitFor(() => {
        expect(getByText('Failed to update options')).toBeInTheDocument();
        expect(getByText('test-error')).toBeInTheDocument();
      });
    });
  });
});
