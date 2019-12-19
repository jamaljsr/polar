import { wait } from '@testing-library/dom';
import { notification } from 'antd';
import { createStore } from 'easy-peasy';
import { BitcoindVersion, LndVersion, Status } from 'shared/types';
import { BitcoindLibrary, DockerLibrary } from 'types';
import { LOADING_NODE_ID } from 'utils/constants';
import { injections, lightningServiceMock } from 'utils/tests';
import appModel from './app';
import bitcoindModel from './bitcoind';
import designerModel from './designer';
import lightningModel from './lightning';
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
    lightning: lightningModel,
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
        clightningNodes: 1,
        bitcoindNodes: 2,
      });
    });

    it('should have a chart in state', () => {
      const { activeId, allCharts, activeChart } = store.getState().designer;
      const chart = allCharts[firstNetwork().id];
      expect(activeId).toBe(-1);
      expect(activeChart).toBeUndefined();
      expect(chart).not.toBeUndefined();
      expect(Object.keys(chart.nodes)).toHaveLength(5);
    });

    it('should set the active chart', () => {
      store.getActions().designer.setActiveId(firstNetwork().id);
      const { activeId, activeChart } = store.getState().designer;
      expect(activeId).toBe(firstNetwork().id);
      expect(activeChart).toBeDefined();
      expect(Object.keys(activeChart.nodes)).toHaveLength(5);
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
            message: 'Cannot connect nodes',
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
            message: 'Cannot connect nodes',
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

      it('should throw an error for bitcoin to bitcoin node links', () => {
        const { onLinkStart, onLinkComplete } = store.getActions().designer;
        const data = {
          ...payload,
          fromNodeId: 'backend1',
          fromPortId: 'peer-right',
          toNodeId: 'backend2',
          toPortId: 'peer-left',
        };
        const spy = jest.spyOn(store.getActions().app, 'notify');
        onLinkStart(data);
        onLinkComplete(data);
        expect(spy).toBeCalledWith(
          expect.objectContaining({
            message: 'Cannot connect nodes',
            error: new Error(
              'Connections between bitcoin nodes are managed automatically',
            ),
          }),
        );
      });

      it('should throw an error for LN -> backend if backend ports are not used', () => {
        const { onLinkStart, onLinkComplete } = store.getActions().designer;
        const data = {
          ...payload,
          fromNodeId: 'alice',
          fromPortId: 'empty-right',
          toNodeId: 'backend2',
          toPortId: 'backend',
        };
        const spy = jest.spyOn(store.getActions().app, 'notify');
        onLinkStart(data);
        onLinkComplete(data);
        expect(spy).toBeCalledWith(
          expect.objectContaining({
            message: 'Cannot connect nodes',
            error: new Error(
              'Use the top & bottom ports to connect between bitcoin and lightning nodes',
            ),
          }),
        );
      });

      it('should show the ChangeBackend modal when dragging from LN -> backend', () => {
        const { onLinkStart, onLinkComplete } = store.getActions().designer;
        const data = {
          ...payload,
          fromNodeId: 'alice',
          fromPortId: 'backend',
          toNodeId: 'backend2',
          toPortId: 'backend',
        };
        expect(store.getState().modals.changeBackend.visible).toBe(false);
        onLinkStart(data);
        onLinkComplete(data);
        expect(store.getState().modals.changeBackend.visible).toBe(true);
      });

      it('should show the ChangeBackend modal when dragging from backend -> LN', () => {
        const { onLinkStart, onLinkComplete } = store.getActions().designer;
        const data = {
          ...payload,
          fromNodeId: 'backend2',
          fromPortId: 'backend',
          toNodeId: 'alice',
          toPortId: 'backend',
        };
        expect(store.getState().modals.changeBackend.visible).toBe(false);
        onLinkStart(data);
        onLinkComplete(data);
        expect(store.getState().modals.changeBackend.visible).toBe(true);
      });
    });

    describe('onCanvasDrop', () => {
      const mockDockerService = injections.dockerService as jest.Mocked<DockerLibrary>;
      const mockBitcoindService = injections.bitcoindService as jest.Mocked<
        BitcoindLibrary
      >;
      const data = { type: 'lnd', version: LndVersion.latest };
      const position = { x: 10, y: 10 };

      beforeEach(() => {
        const { setActiveId } = store.getActions().designer;
        setActiveId(firstNetwork().id);
      });

      it('should add a new node to the network', async () => {
        const { onCanvasDrop } = store.getActions().designer;
        expect(firstNetwork().nodes.lightning).toHaveLength(3);
        onCanvasDrop({ data, position });
        await wait(() => {
          expect(firstNetwork().nodes.lightning).toHaveLength(4);
        });
      });

      it('should add a new LN node to the chart', async () => {
        const { onCanvasDrop } = store.getActions().designer;
        expect(Object.keys(firstChart().nodes)).toHaveLength(5);
        onCanvasDrop({ data, position });
        await wait(() => {
          expect(Object.keys(firstChart().nodes)).toHaveLength(6);
          expect(firstChart().nodes['carol']).toBeDefined();
        });
      });

      it('should add a new bitcoin node to the chart', async () => {
        const { onCanvasDrop } = store.getActions().designer;
        expect(Object.keys(firstChart().nodes)).toHaveLength(5);
        const bitcoinData = { type: 'bitcoind', version: BitcoindVersion.latest };
        onCanvasDrop({ data: bitcoinData, position });
        await wait(() => {
          expect(Object.keys(firstChart().nodes)).toHaveLength(6);
          expect(firstChart().nodes['backend2']).toBeDefined();
        });
      });

      it('should add a new bitcoin node without a link', async () => {
        const { addNetwork } = store.getActions().network;
        const { onCanvasDrop, setActiveId } = store.getActions().designer;
        await addNetwork({
          name: 'test 3',
          lndNodes: 0,
          clightningNodes: 0,
          bitcoindNodes: 0,
        });
        const newId = store.getState().network.networks[1].id;
        setActiveId(newId);
        const getChart = () => store.getState().designer.allCharts[newId];
        expect(Object.keys(getChart().nodes)).toHaveLength(0);
        const bitcoinData = { type: 'bitcoind', version: BitcoindVersion.latest };
        onCanvasDrop({ data: bitcoinData, position });
        await wait(() => {
          expect(Object.keys(getChart().nodes)).toHaveLength(1);
          expect(Object.keys(getChart().links)).toHaveLength(0);
          expect(getChart().nodes['backend1']).toBeDefined();
        });
      });

      it('should update docker compose file', async () => {
        mockDockerService.saveComposeFile.mockReset();
        const { onCanvasDrop } = store.getActions().designer;
        onCanvasDrop({ data, position });
        await wait(() => {
          expect(mockDockerService.saveComposeFile).toBeCalledTimes(1);
          expect(firstNetwork().nodes.lightning).toHaveLength(4);
          expect(firstNetwork().nodes.lightning[2].name).toBe('carol');
        });
      });

      it('should throw an error when adding an incompatible LN node', async () => {
        const { onCanvasDrop } = store.getActions().designer;
        const spy = jest.spyOn(store.getActions().app, 'notify');
        const data = { type: 'lnd', version: LndVersion['0.7.1-beta'] };
        onCanvasDrop({ data, position });
        await wait(() => {
          expect(spy).toBeCalledWith(
            expect.objectContaining({
              message: 'Failed to add node',
              error: new Error(
                'This network does not contain a Bitcoin Core v0.18.1 (or lower) node which is required for LND v0.7.1-beta',
              ),
            }),
          );
        });
      });

      it('should not add the node if the network is transitioning', async () => {
        const { setStatus } = store.getActions().network;
        setStatus({ id: firstNetwork().id, status: Status.Starting });
        const { onCanvasDrop } = store.getActions().designer;
        onCanvasDrop({ data, position });
        await wait(() => {
          expect(firstNetwork().nodes.lightning).toHaveLength(3);
          expect(mockNotification.error).toBeCalledWith(
            expect.objectContaining({ message: 'Failed to add node' }),
          );
        });
      });

      it('should not add an unsupported node type', async () => {
        const { onCanvasDrop } = store.getActions().designer;
        onCanvasDrop({ data: { type: 'other' }, position });
        await wait(() => {
          expect(firstNetwork().nodes.lightning).toHaveLength(3);
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
        const { setStatus } = store.getActions().network;
        setStatus({ id: firstNetwork().id, status: Status.Started });
        const { onCanvasDrop } = store.getActions().designer;
        onCanvasDrop({ data, position });
        await wait(() => {
          expect(mockDockerService.startNode).toBeCalledTimes(1);
          expect(mockDockerService.startNode).toBeCalledWith(
            expect.objectContaining({ name: firstNetwork().name }),
            expect.objectContaining({ name: firstNetwork().nodes.lightning[3].name }),
          );
          expect(firstNetwork().nodes.lightning).toHaveLength(4);
          expect(firstNetwork().nodes.lightning[3].status).toBe(Status.Started);
        });
      });
    });
  });
});
