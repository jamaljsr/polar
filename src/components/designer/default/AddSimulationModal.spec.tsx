import React from 'react';
import AddSimulationModal from './AddSimulationModal';
import { createNetwork } from 'utils/network';
import { defaultRepoState } from 'utils/constants';
import { renderWithProviders, testManagedImages } from 'utils/tests';
import { Status } from 'shared/types';
import { fireEvent, waitFor } from '@testing-library/react';

describe('AddSimulationModal', () => {
  let unmount: () => void;

  const renderComponent = async (status?: Status) => {
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
    });
    const initialState = {
      network: {
        networks: [network],
      },
      modals: {
        addSimulation: {
          visible: true,
        },
      },
    };

    const cmp = <AddSimulationModal network={network} />;
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
    expect(getByText('Add Simulation')).toBeInTheDocument();
    expect(getByText('Source')).toBeInTheDocument();
    expect(getByText('Destination')).toBeInTheDocument();
    expect(getByText('Interval (secs)')).toBeInTheDocument();
    expect(getByText('Amount (msat)')).toBeInTheDocument();
  });

  it('should render form inputs', async () => {
    const { getByLabelText } = await renderComponent();
    expect(getByLabelText('Source')).toBeInTheDocument();
    expect(getByLabelText('Destination')).toBeInTheDocument();
    expect(getByLabelText('Interval (secs)')).toBeInTheDocument();
    expect(getByLabelText('Amount (msat)')).toBeInTheDocument();
  });

  it('should render button', async () => {
    const { getByText } = await renderComponent();
    expect(getByText('Create')).toBeInTheDocument();
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
    const { getByText } = await renderComponent();
    fireEvent.click(getByText('Create'));
    await waitFor(() => {
      expect(getByText('Create')).toBeInTheDocument();
    });
  });

  describe('with form submitted', () => {
    it('should create a simulation', async () => {
      const { getByText, getByLabelText, store } = await renderComponent();
      fireEvent.change(getByLabelText('Source'), { target: { value: 'alice' } });
      fireEvent.change(getByLabelText('Destination'), { target: { value: 'bob' } });
      fireEvent.change(getByLabelText('Interval (secs)'), { target: { value: '1000' } });
      fireEvent.change(getByLabelText('Amount (msat)'), { target: { value: '1000000' } });
      fireEvent.click(getByText('Create'));
      await waitFor(() => {
        expect(store.getState().modals.addSimulation.visible).toBe(false);
        expect(store.getState().network.networks[0].simulation).toBeDefined();
      });
    });

    it('should throw an error if source or destination node is not found', async () => {
      const { getByText, getByLabelText, network, findByText } = await renderComponent(
        Status.Started,
      );
      fireEvent.change(getByLabelText('Source'), { target: { value: 'alice' } });
      fireEvent.change(getByLabelText('Destination'), { target: { value: 'bob' } });
      fireEvent.change(getByLabelText('Interval (secs)'), { target: { value: '10' } });
      fireEvent.change(getByLabelText('Amount (msat)'), { target: { value: '1000000' } });
      network.nodes.lightning = [];
      fireEvent.click(getByText('Create'));
      expect(
        await findByText('Source or destination node not found'),
      ).toBeInTheDocument();
    });
  });
});
