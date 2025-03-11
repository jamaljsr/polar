import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react';
import SimulationDesignerTab from './SimulationDesignerTab';
import { Status } from 'shared/types';
import { injections, renderWithProviders, testManagedImages } from 'utils/tests';
import { createNetwork } from 'utils/network';
import { defaultRepoState } from 'utils/constants';
import { initChartFromNetwork } from 'utils/chart';
import { ipcChannels } from 'shared';

const mockDockerService = injections.dockerService as jest.Mocked<
  typeof injections.dockerService
>;

describe('SimulationDesignerTab', () => {
  const renderComponent = (status?: Status, simStatus?: Status, noSim?: boolean) => {
    const network = createNetwork({
      id: 1,
      name: 'test network',
      description: 'network description',
      lndNodes: 2,
      clightningNodes: 0,
      eclairNodes: 0,
      litdNodes: 0,
      bitcoindNodes: 2,
      tapdNodes: 0,
      repoState: defaultRepoState,
      managedImages: testManagedImages,
      customImages: [],
      status,
      manualMineCount: 6,
    });

    if (!noSim) {
      network.simulation = {
        activity: [
          {
            id: 0,
            source: network.nodes.lightning[0].name,
            destination: network.nodes.lightning[1].name,
            intervalSecs: 10,
            amountMsat: 1000000,
          },
        ],
        status: simStatus ?? Status.Stopped,
      };
    }
    const chart = initChartFromNetwork(network);

    const initialState = {
      network: {
        networks: [network],
      },
      modals: {
        addSimulation: {
          visible: false,
        },
      },
      designer: {
        allCharts: {
          [network.id]: chart,
        },
      },
    };

    const result = renderWithProviders(<SimulationDesignerTab network={network} />, {
      initialState,
    });

    return {
      ...result,
      network,
    };
  };

  describe('Simulation Designer Tab', () => {
    it('should render the simulation designer tab', async () => {
      const { getByText, store } = renderComponent(Status.Started, Status.Started, true);
      expect(getByText('No simulations created yet')).toBeInTheDocument();

      const addSimulationBtn = getByText('Add a new Simulation');
      expect(addSimulationBtn).toBeInTheDocument();
      fireEvent.click(addSimulationBtn);
      await waitFor(() => {
        expect(store.getState().modals.addSimulation.visible).toBe(true);
      });
    });

    it('should show add simulation button if no simulation is defined', async () => {
      const { getByText } = renderComponent(Status.Started, Status.Started, true);
      expect(getByText('No simulations created yet')).toBeInTheDocument();

      const addSimulationBtn = getByText('Add a new Simulation');
      expect(addSimulationBtn).toBeInTheDocument();
    });
  });

  describe('Start Simulation', () => {
    it('should start simulation successfully', async () => {
      const { getByText } = renderComponent(Status.Started);
      expect(getByText('Start')).toBeInTheDocument();

      fireEvent.click(getByText('Start'));
      await waitFor(() => {
        expect(mockDockerService.startSimulation).toHaveBeenCalled();
      });
    });

    it('should show error if simulation fails to start', async () => {
      // Simulation should fail to start because the network is not started,
      // which means the lightning nodes are not running.
      const { getByText } = renderComponent(Status.Stopped);
      fireEvent.click(getByText('Start'));

      await waitFor(() => {
        expect(getByText('Unable to start the simulation')).toBeInTheDocument();
      });
    });
  });

  describe('Stop Simulation', () => {
    it('should stop simulation successfully', async () => {
      const { getByText } = renderComponent(Status.Started, Status.Started);
      expect(getByText('Stop')).toBeInTheDocument();
      fireEvent.click(getByText('Stop'));
      await waitFor(() => {
        expect(mockDockerService.stopSimulation).toHaveBeenCalled();
      });
    });

    it('should show error if simulation fails to stop', async () => {
      mockDockerService.stopSimulation.mockRejectedValue(new Error('simulation-error'));
      const { getByText } = renderComponent(Status.Started, Status.Started);
      fireEvent.click(getByText('Stop'));

      await waitFor(() => {
        expect(getByText('Unable to stop the simulation')).toBeInTheDocument();
        expect(getByText('simulation-error')).toBeInTheDocument();
      });
    });
  });

  describe('Remove Simulation', () => {
    it('should remove simulation', async () => {
      const { getByText, getByLabelText, findByText } = renderComponent(Status.Started);
      fireEvent.mouseOver(getByLabelText('more'));
      fireEvent.click(await findByText('Delete'));
      await waitFor(() => {
        expect(getByText('Remove Simulation')).toBeInTheDocument();
      });

      fireEvent.click(getByText('Remove'));
      await waitFor(() => {
        expect(getByText('Simulation removed successfully')).toBeInTheDocument();
      });
    });

    it('should return early if no simulation is defined', async () => {
      const { getByText, network, findByText, getByLabelText } = renderComponent(
        Status.Started,
        Status.Stopped,
      );
      const activity = {
        id: 0,
        source: network.nodes.lightning[0].name,
        destination: network.nodes.lightning[1].name,
        intervalSecs: 10,
        amountMsat: 1000000,
      };
      const sim = {
        networkId: 1,
        status: Status.Stopped,
        activity: [activity],
      };

      // This is an unlikely scenario, as the start button is not
      // visible if no simulation is defined.
      network.simulation = undefined;
      expect(getByText('Start')).toBeInTheDocument();
      fireEvent.click(getByText('Start'));
      expect(getByText('No simulations created yet')).toBeInTheDocument();

      network.simulation = { ...sim, status: Status.Started };
      await waitFor(() => {
        expect(getByText('Stop')).toBeInTheDocument();
      });
      network.simulation = undefined;
      expect(getByText('Stop')).toBeInTheDocument();
      fireEvent.click(getByText('Stop'));
      expect(getByText('No simulations created yet')).toBeInTheDocument();

      network.simulation = { ...sim, status: Status.Stopped };
      await waitFor(() => {
        expect(getByText('Start')).toBeInTheDocument();
      });

      network.simulation = undefined;
      fireEvent.mouseOver(getByLabelText('more'));
      fireEvent.click(await findByText('Delete'));
      fireEvent.click(await findByText('Remove'));
      await waitFor(() => {
        expect(mockDockerService.removeSimulation).not.toHaveBeenCalled();
      });
    });

    it('should show error if no activities are added', async () => {
      const { getByText, network, store } = renderComponent(
        Status.Started,
        Status.Started,
        true,
      );

      const sim = {
        networkId: 1,
        status: Status.Stopped,
        activity: [],
      };

      network.simulation = sim;
      store.getActions().network.setNetworks([network]);

      fireEvent.click(getByText('Start'));
      await waitFor(() => {
        expect(
          getByText('Add activities to the simulation to start it.'),
        ).toBeInTheDocument();
      });
    });

    it('should send an ipc message when the button is clicked', async () => {
      const { getByText, getByLabelText, findByText, network, store } = renderComponent();
      const activity = {
        id: 0,
        source: network.nodes.lightning[0].name,
        destination: network.nodes.lightning[1].name,
        intervalSecs: 10,
        amountMsat: 1000000,
      };
      const sim = {
        networkId: 1,
        status: Status.Started,
        activity: [activity],
      };

      network.simulation = sim;
      store.getActions().network.setNetworks([network]);
      fireEvent.mouseOver(getByLabelText('more'));
      fireEvent.click(await findByText('Delete'));
      const ipcMock = injections.ipc as jest.Mock;
      ipcMock.mockResolvedValue(true);
      fireEvent.click(getByText('View Logs'));
      const url = '/logs/simln/polar-n1-simln';
      await waitFor(() => {
        expect(ipcMock).toBeCalledWith(ipcChannels.openWindow, { url });
      });
    });
  });
});
