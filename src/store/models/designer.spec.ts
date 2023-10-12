import { IPosition } from '@mrblenny/react-flow-chart';
import { waitFor } from '@testing-library/react';
import { notification } from 'antd';
import { createStore } from 'easy-peasy';
import { Status } from 'shared/types';
import { BitcoindLibrary, DockerLibrary } from 'types';
import { initChartFromNetwork } from 'utils/chart';
import { defaultRepoState, LOADING_NODE_ID } from 'utils/constants';
import * as files from 'utils/files';
import { createBitcoindNetworkNode, createCLightningNetworkNode } from 'utils/network';
import {
  getNetwork,
  injections,
  lightningServiceMock,
  testNodeDocker,
  testRepoState,
} from 'utils/tests';
import appModel from './app';
import bitcoindModel from './bitcoind';
import designerModel from './designer';
import lightningModel from './lightning';
import modalsModel from './modals';
import networkModel from './network';
import tapModel from './tap';

jest.mock('antd', () => ({
  ...(jest.requireActual('antd') as any),
  notification: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('utils/files', () => ({
  exists: jest.fn(),
}));
const filesMock = files as jest.Mocked<typeof files>;

const mockNotification = notification as jest.Mocked<typeof notification>;

describe('Designer model', () => {
  const rootModel = {
    app: appModel,
    network: networkModel,
    lightning: lightningModel,
    bitcoind: bitcoindModel,
    designer: designerModel,
    modals: modalsModel,
    tap: tapModel,
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
      const network = getNetwork(2, 'test network', Status.Stopped, 2);
      const cligntningNode = createCLightningNetworkNode(
        network,
        testRepoState.images['c-lightning'].latest,
        testRepoState.images['c-lightning'].compatibility,
        testNodeDocker,
      );
      network.nodes.lightning.push(cligntningNode);
      const bitcoinNode = createBitcoindNetworkNode(
        network,
        testRepoState.images.bitcoind.latest,
        testNodeDocker,
      );
      network.nodes.bitcoin.push(bitcoinNode);
      store.getActions().network.setNetworks([network]);
      const chart = initChartFromNetwork(network);
      store.getActions().designer.setChart({ id: network.id, chart });
      store.getActions().designer.setActiveId(network.id);
    });

    it('should have a chart in state', () => {
      const { allCharts } = store.getState().designer;
      const chart = allCharts[firstNetwork().id];
      expect(chart).not.toBeUndefined();
      expect(Object.keys(chart.nodes)).toHaveLength(7);
    });

    it('should set the active chart', () => {
      store.getActions().designer.setActiveId(firstNetwork().id);
      const { activeId, activeChart } = store.getState().designer;
      expect(activeId).toBe(firstNetwork().id);
      expect(activeChart).toBeDefined();
      expect(Object.keys(activeChart.nodes)).toHaveLength(7);
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
        eclairNodes: 0,
        bitcoindNodes: 1,
        customNodes: {},
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
      it('should show the ChangeBackend modal when dragging from LND -> tap', async () => {
        filesMock.exists.mockResolvedValue(Promise.resolve(false));
        const { onLinkStart, onLinkComplete } = store.getActions().designer;
        const data = {
          ...payload,
          fromNodeId: 'alice',
          fromPortId: 'lndbackend',
          toNodeId: 'alice-tap',
          toPortId: 'lndbackend',
        };
        expect(store.getState().modals.changeTapBackend.visible).toBe(false);
        onLinkStart(data);
        onLinkComplete(data);
        await waitFor(() => {
          expect(store.getState().modals.changeTapBackend.visible).toBe(true);
        });
      });
      it('should show the ChangeBackend modal when dragging from tap -> LND', async () => {
        filesMock.exists.mockResolvedValue(Promise.resolve(false));
        const { onLinkStart, onLinkComplete } = store.getActions().designer;
        const data = {
          ...payload,
          fromNodeId: 'alice-tap',
          fromPortId: 'lndbackend',
          toNodeId: 'alice',
          toPortId: 'lndbackend',
        };
        expect(store.getState().modals.changeTapBackend.visible).toBe(false);
        onLinkStart(data);
        onLinkComplete(data);
        await waitFor(() => {
          expect(store.getState().modals.changeTapBackend.visible).toBe(true);
        });
      });
      it('should not display modal when dragging from tap -> LND', async () => {
        filesMock.exists.mockResolvedValue(Promise.resolve(true));
        const { onLinkStart, onLinkComplete } = store.getActions().designer;
        const data = {
          ...payload,
          fromNodeId: 'alice-tap',
          fromPortId: 'lndbackend',
          toNodeId: 'alice',
          toPortId: 'lndbackend',
        };
        expect(store.getState().modals.changeTapBackend.visible).toBe(false);
        onLinkStart(data);
        onLinkComplete(data);
        await waitFor(() => {
          expect(store.getState().modals.changeTapBackend.visible).toBe(false);
        });
      });
      it('should show an error when dragging from tap -> tap', () => {
        const { onLinkStart, onLinkComplete } = store.getActions().designer;
        const data = {
          ...payload,
          fromNodeId: 'alice-tap',
          fromPortId: 'lndbackend',
          toNodeId: 'bob-tap',
          toPortId: 'lndbackend',
        };
        const spy = jest.spyOn(store.getActions().app, 'notify');
        onLinkStart(data);
        onLinkComplete(data);
        expect(spy).toBeCalledWith(
          expect.objectContaining({
            message: 'Cannot connect nodes',
            error: new Error('tapd nodes cannot connect to each other.'),
          }),
        );
      });
      it('should show an error when dragging from tap -> non LND node', () => {
        const { onLinkStart, onLinkComplete } = store.getActions().designer;
        const data = {
          ...payload,
          fromNodeId: 'alice-tap',
          fromPortId: 'lndbackend',
          toNodeId: 'carol',
          toPortId: 'lndbackend',
        };
        const spy = jest.spyOn(store.getActions().app, 'notify');
        onLinkStart(data);
        onLinkComplete(data);
        expect(spy).toBeCalledWith(
          expect.objectContaining({
            message: 'Cannot connect nodes',
            error: new Error('carol is not an LND implementation'),
          }),
        );
      });
    });

    describe('onCanvasDrop', () => {
      const mockDockerService = injections.dockerService as jest.Mocked<DockerLibrary>;
      const mockBitcoindService =
        injections.bitcoindService as jest.Mocked<BitcoindLibrary>;
      const lndLatest = defaultRepoState.images.LND.latest;
      const btcLatest = defaultRepoState.images.bitcoind.latest;
      const tapdLatest = defaultRepoState.images.tapd.latest;
      const id = 'nodeId';
      const data = { type: 'LND', version: lndLatest };
      const position = { x: 10, y: 10 };

      beforeEach(() => {
        const { setActiveId } = store.getActions().designer;
        setActiveId(firstNetwork().id);
      });

      it('should add a new node to the network', async () => {
        const { onCanvasDrop } = store.getActions().designer;
        expect(firstNetwork().nodes.lightning).toHaveLength(3);
        onCanvasDrop({ id, data, position });
        await waitFor(() => {
          expect(firstNetwork().nodes.lightning).toHaveLength(4);
        });
      });

      it('should add a new LN node to the chart', async () => {
        const { onCanvasDrop } = store.getActions().designer;
        expect(Object.keys(firstChart().nodes)).toHaveLength(7);
        onCanvasDrop({ id, data, position });
        await waitFor(() => {
          expect(Object.keys(firstChart().nodes)).toHaveLength(8);
          expect(firstChart().nodes['dave']).toBeDefined();
        });
      });

      it('should add a new bitcoin node to the chart', async () => {
        const { onCanvasDrop } = store.getActions().designer;
        expect(Object.keys(firstChart().nodes)).toHaveLength(7);
        const bitcoinData = { type: 'bitcoind', version: btcLatest };
        onCanvasDrop({ id, data: bitcoinData, position });
        await waitFor(() => {
          expect(Object.keys(firstChart().nodes)).toHaveLength(8);
          expect(firstChart().nodes['backend2']).toBeDefined();
        });
      });

      it('should add a new tapd node to the chart', async () => {
        const { addNetwork } = store.getActions().network;
        const { onCanvasDrop, setActiveId } = store.getActions().designer;
        await addNetwork({
          name: 'test 3',
          lndNodes: 0,
          clightningNodes: 0,
          eclairNodes: 0,
          bitcoindNodes: 1,
          customNodes: {},
        });
        const newId = store.getState().network.networks[1].id;
        setActiveId(newId);
        const getChart = () => store.getState().designer.allCharts[newId];
        expect(Object.keys(getChart().nodes)).toHaveLength(1);
        const lndData = { type: 'LND', version: testRepoState.images.LND.versions[0] };
        onCanvasDrop({ id, data: lndData, position });
        const tapdData = { type: 'tapd', version: tapdLatest };
        onCanvasDrop({ id, data: tapdData, position });
        await waitFor(() => {
          expect(Object.keys(getChart().nodes)).toHaveLength(3);
          expect(getChart().nodes['alice-tap']).toBeDefined();
        });
      });

      it('should throw an error when adding an incompatible TAP node', async () => {
        store.getActions().app.setRepoState(testRepoState);
        const { addNetwork } = store.getActions().network;
        const { onCanvasDrop, setActiveId } = store.getActions().designer;
        await addNetwork({
          name: 'test 3',
          lndNodes: 0,
          clightningNodes: 0,
          eclairNodes: 0,
          bitcoindNodes: 1,
          customNodes: {},
        });
        const newId = store.getState().network.networks[1].id;
        setActiveId(newId);
        const getChart = () => store.getState().designer.allCharts[newId];
        expect(Object.keys(getChart().nodes)).toHaveLength(1);
        const lndData = { type: 'LND', version: '0.7.1-beta' };
        onCanvasDrop({ id, data: lndData, position });

        const spy = jest.spyOn(store.getActions().app, 'notify');
        const tapdData = { type: 'tapd', version: tapdLatest };
        onCanvasDrop({ id, data: tapdData, position });
        await waitFor(() => {
          expect(spy).toBeCalledWith(
            expect.objectContaining({
              message: 'Failed to add node',
              error: new Error(
                'This network does not contain a LND v0.16.0-beta (or higher) node which is required for tapd v0.3.0-alpha',
              ),
            }),
          );
        });
      });

      it('should add a new bitcoin node without a link', async () => {
        const { addNetwork } = store.getActions().network;
        const { onCanvasDrop, setActiveId } = store.getActions().designer;
        await addNetwork({
          name: 'test 3',
          lndNodes: 0,
          clightningNodes: 0,
          eclairNodes: 0,
          bitcoindNodes: 0,
          customNodes: {},
        });
        const newId = store.getState().network.networks[1].id;
        setActiveId(newId);
        const getChart = () => store.getState().designer.allCharts[newId];
        expect(Object.keys(getChart().nodes)).toHaveLength(0);
        const bitcoinData = { type: 'bitcoind', version: btcLatest };
        onCanvasDrop({ id, data: bitcoinData, position });
        await waitFor(() => {
          expect(Object.keys(getChart().nodes)).toHaveLength(1);
          expect(Object.keys(getChart().links)).toHaveLength(0);
          expect(getChart().nodes['backend1']).toBeDefined();
        });
      });

      it('should update docker compose file', async () => {
        mockDockerService.saveComposeFile.mockReset();
        const { onCanvasDrop } = store.getActions().designer;
        onCanvasDrop({ id, data, position });
        await waitFor(() => {
          expect(mockDockerService.saveComposeFile).toBeCalledTimes(1);
          expect(firstNetwork().nodes.lightning).toHaveLength(4);
          expect(firstNetwork().nodes.lightning[3].name).toBe('dave');
        });
      });

      it('should throw an error when adding an incompatible LN node', async () => {
        store.getActions().app.setRepoState(testRepoState);
        const { onCanvasDrop } = store.getActions().designer;
        const spy = jest.spyOn(store.getActions().app, 'notify');
        const data = { type: 'LND', version: '0.7.1-beta' };
        onCanvasDrop({ id, data, position });
        await waitFor(() => {
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
        onCanvasDrop({ id, data, position });
        await waitFor(() => {
          expect(firstNetwork().nodes.lightning).toHaveLength(3);
          expect(mockNotification.error).toBeCalledWith(
            expect.objectContaining({ message: 'Failed to add node' }),
          );
        });
      });

      it('should not add an unsupported node type', async () => {
        const { onCanvasDrop } = store.getActions().designer;
        onCanvasDrop({ id, data: { type: 'other' }, position });
        await waitFor(() => {
          expect(firstNetwork().nodes.lightning).toHaveLength(3);
        });
      });

      it('should add and remove a loading node', async () => {
        const { onCanvasDrop } = store.getActions().designer;
        expect(firstChart().nodes[LOADING_NODE_ID]).toBeUndefined();
        onCanvasDrop({ id, data, position });
        expect(firstChart().nodes[LOADING_NODE_ID]).toBeDefined();
        await waitFor(() => {
          expect(firstChart().nodes[LOADING_NODE_ID]).toBeUndefined();
        });
      });

      it('should start the node if the network is running', async () => {
        mockBitcoindService.waitUntilOnline.mockResolvedValue();
        lightningServiceMock.waitUntilOnline.mockResolvedValue();
        const { setStatus } = store.getActions().network;
        setStatus({ id: firstNetwork().id, status: Status.Started });
        const { onCanvasDrop } = store.getActions().designer;
        onCanvasDrop({ id, data, position });
        await waitFor(() => {
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

    describe('FlowChart Actions', () => {
      const position: IPosition = { x: 100, y: 100 };

      it('onDragNode', () => {
        const { onDragNode } = store.getActions().designer;
        // should update position
        onDragNode({ id: 'alice', data: position } as any);
        expect(firstChart().nodes.alice.position).toEqual(position);
        // should do nothing for unknown node
        const before = firstChart();
        onDragNode({ id: 'unknown', data: position } as any);
        expect(firstChart()).toEqual(before);
      });

      it('onDragNodeStop', () => {
        const { onDragNodeStop } = store.getActions().designer;
        // should do nothing
        const before = firstChart();
        onDragNodeStop({} as any);
        expect(firstChart()).toEqual(before);
      });

      it('onDragCanvas', () => {
        const { onDragCanvas } = store.getActions().designer;
        onDragCanvas({ data: { positionX: position.x, positionY: position.y } } as any);
        expect(firstChart().offset).toEqual(position);
      });

      it('onDragCanvasStop', () => {
        const { onDragCanvasStop } = store.getActions().designer;
        // should do nothing
        const before = firstChart();
        onDragCanvasStop({} as any);
        expect(firstChart()).toEqual(before);
      });

      it('onLinkStart', () => {
        const { onLinkStart } = store.getActions().designer;
        expect(firstChart().links['test-link']).toBeUndefined();
        const payload = {
          linkId: 'test-link',
          fromNodeId: 'alice',
          fromPortId: 'empty-left',
        };
        onLinkStart(payload as any);
        expect(firstChart().links['test-link']).toBeDefined();
      });

      it('onLinkMove', () => {
        const { onLinkStart, onLinkMove } = store.getActions().designer;
        // create the link first
        const payload = {
          linkId: 'test-link',
          fromNodeId: 'alice',
          fromPortId: 'empty-left',
        };
        onLinkStart(payload as any);
        expect(firstChart().links['test-link'].to.position).toBeUndefined();
        // move the link
        onLinkMove({ linkId: 'test-link', toPosition: position } as any);
        expect(firstChart().links['test-link'].to.position).toBeDefined();
      });

      it('onLinkComplete', () => {
        // set the nodes to Started
        const { setStatus } = store.getActions().network;
        setStatus({ id: firstNetwork().id, status: Status.Started });

        const { onLinkStart, onLinkComplete } = store.getActions().designer;
        // create the link first
        const payload = {
          linkId: 'test-link',
          fromNodeId: 'alice',
          fromPortId: 'empty-left',
        };
        onLinkStart(payload as any);
        expect(firstChart().links['test-link'].to.nodeId).toBeUndefined();
        // complete the link
        const completePayload = {
          ...payload,
          toNodeId: 'bob',
          toPortId: 'empty-right',
          config: {
            validateLink: () => true,
          },
        };
        onLinkComplete(completePayload as any);
        expect(firstChart().links['test-link'].to.nodeId).toBe('bob');
      });

      it('onLinkCancel', () => {
        const { onLinkStart, onLinkCancel } = store.getActions().designer;
        // create the link first
        const payload = {
          linkId: 'test-link',
          fromNodeId: 'alice',
          fromPortId: 'empty-left',
        };
        onLinkStart(payload as any);
        expect(firstChart().links['test-link']).toBeDefined();
        // cancel the link
        onLinkCancel({ linkId: 'test-link' } as any);
        expect(firstChart().links['test-link']).toBeUndefined();
      });

      it('onLinkMouseEnter - onLinkMouseLeave', () => {
        const { onLinkMouseEnter, onLinkMouseLeave, onLinkStart } =
          store.getActions().designer;
        // happy path
        expect(firstChart().hovered.id).toBeUndefined();
        onLinkMouseEnter({ linkId: 'alice-backend1' });
        expect(firstChart().hovered.id).toBe('alice-backend1');
        expect(firstChart().hovered.type).toBe('link');
        onLinkMouseLeave({ linkId: 'alice-backend1' });
        expect(firstChart().hovered.id).toBeUndefined();
        // with no "to"
        const payload = {
          linkId: 'test-link',
          fromNodeId: 'alice',
          fromPortId: 'empty-left',
        };
        onLinkStart(payload as any);
        const before = firstChart();
        onLinkMouseEnter({ linkId: 'test-link' });
        onLinkMouseLeave({ linkId: 'test-link' });
        expect(firstChart()).toEqual(before);
        // same link hovered twice
        expect(firstChart().hovered.id).toBeUndefined();
        onLinkMouseEnter({ linkId: 'alice-backend1' });
        expect(firstChart().hovered.id).toBe('alice-backend1');
        onLinkMouseEnter({ linkId: 'alice-backend1' });
        expect(firstChart().hovered.id).toBe('alice-backend1');
      });

      it('onLinkClick', () => {
        const { onLinkClick } = store.getActions().designer;
        expect(firstChart().selected.id).toBeUndefined();
        onLinkClick({ linkId: 'alice-backend1' });
        expect(firstChart().selected.id).toBe('alice-backend1');
        expect(firstChart().selected.type).toBe('link');
        // click again does nothing
        const before = firstChart();
        onLinkClick({ linkId: 'alice-backend1' });
        expect(firstChart()).toEqual(before);
      });

      it('onCanvasClick', () => {
        const { onLinkClick, onCanvasClick } = store.getActions().designer;
        expect(firstChart().selected.id).toBeUndefined();
        onLinkClick({ linkId: 'alice-backend1' });
        expect(firstChart().selected.id).toBe('alice-backend1');
        expect(firstChart().selected.type).toBe('link');
        onCanvasClick({});
        expect(firstChart().selected.id).toBeUndefined();
        // click again does nothing
        const before = firstChart();
        onCanvasClick({});
        expect(firstChart()).toEqual(before);
      });

      it('onDeleteKey', () => {
        const { onLinkClick, onDeleteKey, setChart } = store.getActions().designer;
        expect(firstChart().selected.id).toBeUndefined();
        onLinkClick({ linkId: 'alice-backend1' });
        expect(firstChart().selected.id).toBe('alice-backend1');
        expect(firstChart().selected.type).toBe('link');
        onDeleteKey({});
        expect(firstChart().selected.id).toBeUndefined();
        // delete again does nothing
        const before = firstChart() as any;
        delete before.selected;
        setChart({ id: firstNetwork().id, chart: before });
        onDeleteKey({});
        expect(firstChart()).toEqual(before);
      });

      it('onNodeClick', () => {
        const { onNodeClick } = store.getActions().designer;
        expect(firstChart().selected.id).toBeUndefined();
        onNodeClick({ nodeId: 'alice' });
        expect(firstChart().selected.id).toBe('alice');
        expect(firstChart().selected.type).toBe('node');
        // click again does nothing
        const before = firstChart();
        onNodeClick({ nodeId: 'alice' });
        expect(firstChart()).toEqual(before);
      });

      it('onNodeDoubleClick', () => {
        const { onNodeDoubleClick } = store.getActions().designer;
        expect(firstChart().selected.id).toBeUndefined();
        onNodeDoubleClick({ nodeId: 'alice' });
        expect(firstChart().selected.id).toBe('alice');
        expect(firstChart().selected.type).toBe('node');
        // doubleClick again does nothing
        const before = firstChart();
        onNodeDoubleClick({ nodeId: 'alice' });
        expect(firstChart()).toEqual(before);
      });

      it('onNodeMouseEnter - onNodeMouseLeave', () => {
        const { onNodeMouseEnter, onNodeMouseLeave } = store.getActions().designer;
        expect(firstChart().hovered.id).toBeUndefined();
        onNodeMouseEnter({ nodeId: 'alice' });
        expect(firstChart().hovered.id).toBe('alice');
        expect(firstChart().hovered.type).toBe('node');
        onNodeMouseLeave({ nodeId: 'alice' });
        expect(firstChart().hovered.id).toBeUndefined();
        // leave again does nothing
        const before = firstChart();
        onNodeMouseLeave({ nodeId: 'alice' });
        expect(firstChart()).toEqual(before);
      });

      it('onPortPositionChange', () => {
        const { onPortPositionChange } = store.getActions().designer;
        // does nothing without size
        const before = firstChart();
        const node = { ...before.nodes['alice'], size: undefined };
        onPortPositionChange({ node } as any);
        expect(firstChart()).toEqual(before);
      });

      it('onZoomCanvas', () => {
        const { onZoomCanvas } = store.getActions().designer;
        const data = { positionX: 100, positionY: 100, zoom: 0.5, scale: 2 };
        onZoomCanvas({ data } as any);
        expect(firstChart().offset).toEqual({ x: 100, y: 100 });
        expect(firstChart().scale).toEqual(2);
      });
    });
  });
});
