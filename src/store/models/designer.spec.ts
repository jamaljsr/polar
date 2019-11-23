import { wait } from '@testing-library/dom';
import { notification } from 'antd';
import { createStore } from 'easy-peasy';
import { Status } from 'shared/types';
import { BitcoindLibrary, DockerLibrary } from 'types';
import { LOADING_NODE_ID } from 'utils/constants';
import { injections, lightningServiceMock } from 'utils/tests';
import appModel from './app';
import bitcoindModel from './bitcoind';
import designerModel from './designer';
import modalsModel from './modals';
import networkModel from './network';

jest.mock('antd', () => ({
  ...jest.requireActual('antd'),
  notification: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

const mockNotification = notification as jest.Mocked<typeof notification>;

describe('Designer model', () => {
  const rootModel = {
    app: appModel,
    network: networkModel,
    bitcoind: bitcoindModel,
    designer: designerModel,
    modals: modalsModel,
  };
  // initialize store for type inference
  let store = createStore(rootModel, { injections });

  beforeEach(() => {
    // reset the store before each test run
    store = createStore(rootModel, { injections });
  });

  describe('with default state', () => {
    it('should have the correct default state', () => {
      const { activeId, allCharts, activeChart } = store.getState().designer;
      expect(activeId).toBe(-1);
      expect(activeChart).toBeUndefined();
      expect(allCharts).toEqual({});
    });

    it('should throw when setting an invalid chart as active', () => {
      const { setActiveId } = store.getActions().designer;
      expect(() => setActiveId(99)).toThrow(/Chart not found/);
    });
  });

  describe('with charts', () => {
    // helper to get the first network in the store
    const firstNetwork = () => store.getState().network.networks[0];
    const firstChart = () => store.getState().designer.allCharts[firstNetwork().id];

    beforeEach(async () => {
      const { addNetwork } = store.getActions().network;
      await addNetwork({
        name: 'test',
        lndNodes: 2,
        clightningNodes: 0,
        bitcoindNodes: 1,
      });
    });

    it('should have a chart in state', () => {
      const { activeId, allCharts, activeChart } = store.getState().designer;
      const chart = allCharts[firstNetwork().id];
      expect(activeId).toBe(-1);
      expect(activeChart).toBeUndefined();
      expect(chart).not.toBeUndefined();
      expect(Object.keys(chart.nodes)).toHaveLength(3);
    });

    it('should set the active chart', () => {
      store.getActions().designer.setActiveId(firstNetwork().id);
      const { activeId, activeChart } = store.getState().designer;
      expect(activeId).toBe(firstNetwork().id);
      expect(activeChart).toBeDefined();
      expect(Object.keys(activeChart.nodes)).toHaveLength(3);
    });

    it('should remove the active chart', () => {
      store.getActions().designer.setActiveId(firstNetwork().id);
      const { removeChart } = store.getActions().designer;
      removeChart(firstNetwork().id);
      const { activeId, activeChart } = store.getState().designer;
      expect(activeId).toBe(-1);
      expect(activeChart).toBeUndefined();
    });

    it('should remove an inactive chart', async () => {
      const { addNetwork } = store.getActions().network;
      await addNetwork({
        name: 'test 2',
        lndNodes: 2,
        clightningNodes: 0,
        bitcoindNodes: 1,
      });
      store.getActions().designer.setActiveId(firstNetwork().id);
      const { removeChart } = store.getActions().designer;
      const idToRemove = store.getState().network.networks[1].id;
      removeChart(idToRemove);
      const { activeId, activeChart, allCharts } = store.getState().designer;
      expect(allCharts[idToRemove]).toBeUndefined();
      expect(activeId).toBe(firstNetwork().id);
      expect(activeChart).toBeDefined();
    });

    it('should update the nodes status when the network is updated', () => {
      let chart = firstChart();
      Object.keys(chart.nodes).forEach(name =>
        expect(chart.nodes[name].properties.status).toBe(Status.Stopped),
      );
      const { setStatus } = store.getActions().network;
      setStatus({ id: firstNetwork().id, status: Status.Started, all: true });
      chart = firstChart();
      Object.keys(chart.nodes).forEach(name =>
        expect(chart.nodes[name].properties.status).toBe(Status.Started),
      );
    });

    it('should update node sizes when redrawn', () => {
      const { redrawChart, setActiveId } = store.getActions().designer;
      setActiveId(firstNetwork().id);
      expect((firstChart().nodes['alice'].size || {}).height).toBe(36);
      redrawChart();
      expect((firstChart().nodes['alice'].size || {}).height).toBe(36 + 1);
      redrawChart();
      expect((firstChart().nodes['alice'].size || {}).height).toBe(36);
    });

    it('should not update the chart if the size is undefined', () => {
      const { redrawChart, setActiveId, setAllCharts } = store.getActions().designer;
      setActiveId(firstNetwork().id);
      const charts = store.getState().designer.allCharts;
      charts[firstNetwork().id].nodes['alice'].size = undefined;
      setAllCharts(charts);
      expect((firstChart().nodes['alice'].size || {}).height).toBeUndefined();
      redrawChart();
      expect((firstChart().nodes['alice'].size || {}).height).toBeUndefined();
    });

    describe('onLinkCompleteListener', () => {
      let payload: any;

      beforeEach(() => {
        const { onLinkStart, setActiveId } = store.getActions().designer;
        setActiveId(firstNetwork().id);
        payload = {
          linkId: 'newlink',
          fromNodeId: 'alice',
          fromPortId: 'empty-right',
          toNodeId: 'bob',
          toPortId: 'empty-left',
          startEvent: {} as React.MouseEvent,
        };
        onLinkStart(payload);
      });

      it('should show the Open Channel modal', () => {
        const { onLinkComplete } = store.getActions().designer;
        const { setStatus } = store.getActions().network;
        setStatus({ id: firstNetwork().id, status: Status.Started });
        onLinkComplete(payload);
        expect(firstChart().links[payload.linkId]).not.toBeUndefined();
        expect(mockNotification.error).not.toBeCalled();
        expect(store.getState().modals.openChannel.visible).toBe(true);
      });

      it('should not open modal if the link does not exist', () => {
        const { onLinkComplete } = store.getActions().designer;
        // a link from a node to itself will not be created
        payload.toNodeId = 'alice';
        onLinkComplete(payload);
        expect(firstChart().links[payload.linkId]).toBeUndefined();
        expect(mockNotification.error).not.toBeCalled();
      });

      it('should not add link if the two nodes are not lightning', async () => {
        const { onLinkComplete, setAllCharts } = store.getActions().designer;
        const charts = store.getState().designer.allCharts;
        charts[firstNetwork().id].nodes['alice'].type = 'other';
        setAllCharts(charts);

        onLinkComplete(payload);
        expect(firstChart().links[payload.linkId]).toBeUndefined();
        expect(mockNotification.error).toBeCalledWith(
          expect.objectContaining({
            message: 'Cannot open a channel',
          }),
        );
      });

      it('should not add link if the network does not exist', () => {
        const { setNetworks } = store.getActions().network;
        const { onLinkComplete } = store.getActions().designer;
        setNetworks([]);
        onLinkComplete(payload);
        expect(
          store.getState().designer.activeChart.links[payload.linkId],
        ).toBeUndefined();
        expect(mockNotification.error).toBeCalledWith(
          expect.objectContaining({
            message: 'Cannot open a channel',
          }),
        );
      });

      it('should not add link if the network is not started', () => {
        const { onLinkComplete } = store.getActions().designer;
        onLinkComplete(payload);
        expect(firstChart().links[payload.linkId]).toBeUndefined();
        expect(mockNotification.error).toBeCalledWith(
          expect.objectContaining({
            description: 'The nodes must be Started first',
          }),
        );
      });
    });

    describe('onCanvasDrop', () => {
      const mockDockerService = injections.dockerService as jest.Mocked<DockerLibrary>;
      const mockBitcoindService = injections.bitcoindService as jest.Mocked<
        BitcoindLibrary
      >;
      const data = { type: 'lnd' };
      const position = { x: 10, y: 10 };

      beforeEach(() => {
        const { setActiveId } = store.getActions().designer;
        setActiveId(firstNetwork().id);
      });

      it('should add a new node to the network', async () => {
        const { onCanvasDrop } = store.getActions().designer;
        expect(firstNetwork().nodes.lightning).toHaveLength(2);
        onCanvasDrop({ data, position });
        await wait(() => {
          expect(firstNetwork().nodes.lightning).toHaveLength(3);
        });
      });

      it('should add a new node to the chart', async () => {
        const { onCanvasDrop } = store.getActions().designer;
        expect(Object.keys(firstChart().nodes)).toHaveLength(3);
        onCanvasDrop({ data, position });
        await wait(() => {
          expect(Object.keys(firstChart().nodes)).toHaveLength(4);
          expect(firstChart().nodes['carol']).toBeDefined();
        });
      });

      it('should update docker compose file', async () => {
        mockDockerService.saveComposeFile.mockReset();
        const { onCanvasDrop } = store.getActions().designer;
        onCanvasDrop({ data, position });
        await wait(() => {
          expect(mockDockerService.saveComposeFile).toBeCalledTimes(1);
          expect(firstNetwork().nodes.lightning).toHaveLength(3);
          expect(firstNetwork().nodes.lightning[2].name).toBe('carol');
        });
      });

      it('should not add the node if the network is transitioning', async () => {
        const { setStatus } = store.getActions().network;
        setStatus({ id: firstNetwork().id, status: Status.Starting });
        const { onCanvasDrop } = store.getActions().designer;
        onCanvasDrop({ data, position });
        await wait(() => {
          expect(firstNetwork().nodes.lightning).toHaveLength(2);
          expect(mockNotification.error).toBeCalledWith(
            expect.objectContaining({ message: 'Failed to add node' }),
          );
        });
      });

      it('should not add an unsupported node type', async () => {
        const { onCanvasDrop } = store.getActions().designer;
        onCanvasDrop({ data: { type: 'other' }, position });
        await wait(() => {
          expect(firstNetwork().nodes.lightning).toHaveLength(2);
        });
      });

      it('should add and remove a loading node', async () => {
        const { onCanvasDrop } = store.getActions().designer;
        expect(firstChart().nodes[LOADING_NODE_ID]).toBeUndefined();
        onCanvasDrop({ data, position });
        expect(firstChart().nodes[LOADING_NODE_ID]).toBeDefined();
        await wait(() => {
          expect(firstChart().nodes[LOADING_NODE_ID]).toBeUndefined();
        });
      });

      it('should start the node if the network is running', async () => {
        mockBitcoindService.waitUntilOnline.mockResolvedValue();
        lightningServiceMock.waitUntilOnline.mockResolvedValue();
        mockDockerService.start.mockReset();
        const { setStatus } = store.getActions().network;
        setStatus({ id: firstNetwork().id, status: Status.Started });
        const { onCanvasDrop } = store.getActions().designer;
        onCanvasDrop({ data, position });
        await wait(() => {
          expect(mockDockerService.start).toBeCalledTimes(1);
          expect(mockDockerService.start).toBeCalledWith(
            expect.objectContaining({ name: firstNetwork().name }),
          );
          expect(firstNetwork().nodes.lightning).toHaveLength(3);
          expect(firstNetwork().nodes.lightning[2].status).toBe(Status.Started);
        });
      });
    });
  });
});
