import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react';
import { Status } from 'shared/types';
import { Network } from 'types';
import { initChartFromNetwork } from 'utils/chart';
import { getNetwork, injections, renderWithProviders } from 'utils/tests';
import DockerNetworkModal from './DockerNetworkModal';

describe('DockerNetworkModal Component', () => {
  let unmount: () => void;
  const network = getNetwork(0, 'test network', Status.Stopped);

  const renderComponent = async (network: Network) => {
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
        dockerNetwork: {
          visible: true,
          networkName: 'test-external-docker-network',
        },
      },
    };
    const cmp = <DockerNetworkModal network={network} />;
    const result = renderWithProviders(cmp, { initialState });
    unmount = result.unmount;
    return { ...result, network };
  };
  afterEach(() => unmount());

  describe('When the modal displays', () => {
    it('should render labels', async () => {
      const { getByLabelText } = await renderComponent(network);
      expect(getByLabelText('Docker Network Options')).toBeInTheDocument();
    });
    it('should hide when cancel is clicked', async () => {
      const { getByText, queryByText, store } = await renderComponent(network);
      const btn = getByText('Cancel');
      expect(btn).toBeInTheDocument();
      expect(btn.parentElement).toBeInstanceOf(HTMLButtonElement);
      fireEvent.click(btn);
      await waitFor(() => {
        expect(store.getState().modals.dockerNetwork.visible).toBe(false);
        expect(queryByText('Cancel')).not.toBeInTheDocument();
      });
    });

    describe('when OK is hit', () => {
      describe('when the input is blank or default', () => {
        it('should display a message', async () => {
          const { getByText, queryByText, store } = await renderComponent(network);
          const btn = getByText('OK');
          expect(btn).toBeInTheDocument();
          expect(btn.parentElement).toBeInstanceOf(HTMLButtonElement);
          fireEvent.click(btn);
          await waitFor(() => {
            expect(store.getState().modals.dockerNetwork.visible).toBe(false);
            expect(queryByText('Docker Network Options')).not.toBeInTheDocument();
            expect(queryByText('Clearing external network')).toBeInTheDocument();
          });
        });

        it('should display a message', async () => {
          const { getByText, queryByText, getByLabelText, store } = await renderComponent(
            network,
          );
          const input = getByLabelText('External Docker Network');
          fireEvent.change(input, { target: { value: 'default' } });

          const btn = getByText('OK');

          expect(btn).toBeInTheDocument();
          expect(btn.parentElement).toBeInstanceOf(HTMLButtonElement);
          fireEvent.click(btn);
          await waitFor(() => {
            expect(store.getState().modals.dockerNetwork.visible).toBe(false);
            expect(queryByText('Docker Network Options')).not.toBeInTheDocument();
            expect(queryByText('Clearing external network')).toBeInTheDocument();
          });
        });
      });

      describe('when the input matches an existing docker network', () => {
        beforeEach(() => {
          (
            injections.dockerService.getDockerExternalNetworks as jest.Mock
          ).mockResolvedValue(['test-network-1', 'test-network-2']);
        });

        it('should display a attach message', async () => {
          const { getByText, queryByText, getByLabelText, store } = await renderComponent(
            network,
          );
          const input = getByLabelText('External Docker Network');
          fireEvent.change(input, { target: { value: 'test-network-1' } });
          const btn = getByText('OK');
          expect(btn).toBeInTheDocument();
          expect(btn.parentElement).toBeInstanceOf(HTMLButtonElement);
          fireEvent.click(btn);
          await waitFor(() => {
            expect(store.getState().modals.dockerNetwork.visible).toBe(false);
            expect(queryByText('Docker Network Options')).not.toBeInTheDocument();
            expect(queryByText('Attaching test-network-1')).toBeInTheDocument();
          });
        });

        it('should populate the existing external docker network value', async () => {
          const network2 = getNetwork(1, 'test network 2', Status.Stopped);
          network2.externalNetworkName = 'external_docker_network_99';
          const { getByDisplayValue } = await renderComponent(network2);
          await waitFor(() => {
            expect(getByDisplayValue('external_docker_network_99')).toBeInTheDocument();
          });
        });

        it('should display a creating message', async () => {
          const { getByText, queryByText, getByLabelText, store } = await renderComponent(
            network,
          );
          const input = getByLabelText('External Docker Network');
          fireEvent.change(input, { target: { value: 'test-network-3' } });
          const btn = getByText('OK');
          expect(btn).toBeInTheDocument();
          expect(btn.parentElement).toBeInstanceOf(HTMLButtonElement);
          fireEvent.click(btn);
          await waitFor(() => {
            expect(store.getState().modals.dockerNetwork.visible).toBe(false);
            expect(queryByText('Docker Network Options')).not.toBeInTheDocument();
            expect(queryByText('Creating test-network-3')).toBeInTheDocument();
          });
        });
      });
      describe('when the input is invalid', () => {
        it('should isabled the OK button', async () => {
          const { getByText, getByLabelText } = await renderComponent(network);
          const input = getByLabelText('External Docker Network');
          fireEvent.change(input, { target: { value: '__' } });
          await waitFor(() => {
            const btn = getByText('OK');
            expect(btn.parentElement).toBeInstanceOf(HTMLButtonElement);
            expect(btn.parentElement).toBeDisabled();
          });
        });
      });
      describe('when an error is thrown', () => {
        it('should display an error message', async () => {
          const network2 = getNetwork(1, 'test network 2', Status.Stopped);
          const { getByText, queryByText, getByLabelText, store } = await renderComponent(
            network2,
          );
          const input = getByLabelText('External Docker Network');
          fireEvent.change(input, { target: { value: 'test-network-3' } });
          const btn = getByText('OK');
          expect(btn).toBeInTheDocument();
          expect(btn.parentElement).toBeInstanceOf(HTMLButtonElement);
          fireEvent.click(btn);
          await waitFor(() => {
            expect(store.getState().modals.dockerNetwork.visible).toBe(true);
            expect(queryByText('Docker Network Options')).toBeInTheDocument();
            expect(queryByText('Error creating docker network')).toBeInTheDocument();
          });
        });
      });
    });
  });
});
