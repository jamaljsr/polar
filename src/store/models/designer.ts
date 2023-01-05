import RFC, { IChart, IPosition } from '@mrblenny/react-flow-chart';
import {
  Action,
  action,
  ActionOn,
  actionOn,
  Computed,
  computed,
  Thunk,
  thunk,
  ThunkOn,
  thunkOn,
} from 'easy-peasy';
import { AnyNode, Status, TarodNode } from 'shared/types';
import { Network, StoreInjections } from 'types';
import {
  createBitcoinChartNode,
  createLightningChartNode,
  createTarodChartNode,
  rotate,
  snap,
  updateChartFromNodes,
} from 'utils/chart';
import { LOADING_NODE_ID } from 'utils/constants';
import { prefixTranslation } from 'utils/translate';
import { RootModel } from './';

const { l } = prefixTranslation('store.models.designer');

export interface DesignerModel {
  activeId: number;
  allCharts: Record<number, IChart>;
  redraw: boolean;
  selectedNode: Computed<DesignerModel, { type?: string; id?: string }>;
  activeChart: Computed<DesignerModel, IChart>;
  setActiveId: Action<DesignerModel, number>;
  clearActiveId: Action<DesignerModel>;
  setAllCharts: Action<DesignerModel, Record<number, IChart>>;
  setChart: Action<DesignerModel, { id: number; chart: IChart }>;
  removeChart: Action<DesignerModel, number>;
  redrawChart: Action<DesignerModel>;
  syncChart: Thunk<DesignerModel, Network, StoreInjections, RootModel>;
  onNetworkSetStatus: ActionOn<DesignerModel, RootModel>;
  removeLink: Action<DesignerModel, string>;
  updateBackendLink: Action<DesignerModel, { lnName: string; backendName: string }>;
  removeNode: Action<DesignerModel, string>;
  addNode: Action<DesignerModel, { newNode: AnyNode; position: IPosition }>;
  onLinkCompleteListener: ThunkOn<DesignerModel, StoreInjections, RootModel>;
  onCanvasDropListener: ThunkOn<DesignerModel, StoreInjections, RootModel>;
  zoomIn: Action<DesignerModel, any>;
  zoomOut: Action<DesignerModel, any>;
  zoomReset: Action<DesignerModel, any>;
  // Flowchart component callbacks
  onDragNode: Action<DesignerModel, Parameters<RFC.IOnDragNode>[0]>;
  onDragNodeStop: Action<DesignerModel, Parameters<RFC.IOnDragNodeStop>[0]>;
  onDragCanvas: Action<DesignerModel, Parameters<RFC.IOnDragCanvas>[0]>;
  onDragCanvasStop: Action<DesignerModel, Parameters<RFC.IOnDragCanvasStop>[0]>;
  onLinkStart: Action<DesignerModel, Parameters<RFC.IOnLinkStart>[0]>;
  onLinkMove: Action<DesignerModel, Parameters<RFC.IOnLinkMove>[0]>;
  onLinkComplete: Action<DesignerModel, Parameters<RFC.IOnLinkComplete>[0]>;
  onLinkCancel: Action<DesignerModel, Parameters<RFC.IOnLinkCancel>[0]>;
  onLinkMouseEnter: Action<DesignerModel, Parameters<RFC.IOnLinkMouseEnter>[0]>;
  onLinkMouseLeave: Action<DesignerModel, Parameters<RFC.IOnLinkMouseLeave>[0]>;
  onLinkClick: Action<DesignerModel, Parameters<RFC.IOnLinkMouseLeave>[0]>;
  onCanvasClick: Action<DesignerModel, Parameters<RFC.IOnCanvasClick>[0]>;
  onDeleteKey: Action<DesignerModel, Parameters<RFC.IOnDeleteKey>[0]>;
  onNodeClick: Action<DesignerModel, Parameters<RFC.IOnNodeClick>[0]>;
  onNodeDoubleClick: Action<DesignerModel, Parameters<RFC.IOnNodeDoubleClick>[0]>;
  onNodeMouseEnter: Action<DesignerModel, Parameters<RFC.IOnNodeMouseEnter>[0]>;
  onNodeMouseLeave: Action<DesignerModel, Parameters<RFC.IOnNodeMouseLeave>[0]>;
  onNodeSizeChange: Action<DesignerModel, Parameters<RFC.IOnNodeSizeChange>[0]>;
  onPortPositionChange: Action<DesignerModel, Parameters<RFC.IOnPortPositionChange>[0]>;
  onCanvasDrop: Action<DesignerModel, Parameters<RFC.IOnCanvasDrop>[0]>;
  onZoomCanvas: Action<DesignerModel, Parameters<RFC.IOnZoomCanvas>[0]>;
  getSelectedNode: Action<DesignerModel>;
}

const designerModel: DesignerModel = {
  // state properties
  activeId: -1,
  allCharts: {},
  redraw: false,
  selectedNode: computed(state => state.allCharts[state.activeId]?.selected),
  // computed properties/functions
  activeChart: computed(state => state.allCharts[state.activeId]),
  // reducer actions (mutations allowed thx to immer)
  setActiveId: action((state, networkId) => {
    if (!state.allCharts[networkId]) throw new Error(l('notFoundError', { networkId }));
    state.activeId = networkId;
  }),
  clearActiveId: action(state => {
    state.activeId = -1;
  }),
  setAllCharts: action((state, charts) => {
    state.allCharts = charts;
  }),
  setChart: action((state, { id, chart }) => {
    state.allCharts[id] = chart;
  }),
  removeChart: action((state, id) => {
    delete state.allCharts[id];
    if (state.activeId === id) {
      state.activeId = -1;
    }
  }),
  redrawChart: action(state => {
    // This is a bit of a hack to make a minor tweak to the chart because
    // sometimes when updating the state, the chart links do not position
    // themselves correctly
    state.redraw = !state.redraw;
    const { nodes } = state.allCharts[state.activeId];
    Object.values(nodes).forEach(node => {
      if (node.size) {
        node.size = {
          ...node.size,
          height: node.size.height + (state.redraw ? 1 : -1),
        };
      }
    });
  }),
  syncChart: thunk(
    async (actions, network, { getState, getStoreState, getStoreActions }) => {
      if (network.status !== Status.Started) return;
      // fetch data from all of the nodes
      await Promise.all(
        network.nodes.lightning
          .filter(n => n.status === Status.Started)
          .map(getStoreActions().lightning.getAllInfo),
      );
      await Promise.all(
        network.nodes.taro
          .filter(n => n.status === Status.Started)
          .map(getStoreActions().taro.getAllInfo),
      );

      const nodesData = getStoreState().lightning.nodes;
      const { allCharts } = getState();
      // sync the chart with data from all of the nodes
      const chart = updateChartFromNodes(allCharts[network.id], network, nodesData);
      actions.setAllCharts({
        ...allCharts,
        [network.id]: chart,
      });
      actions.redrawChart();
    },
  ),
  onNetworkSetStatus: actionOn(
    (actions, storeActions) => storeActions.network.setStatus,
    (state, { payload }) => {
      const { id, status, only, all = true } = payload;
      const chart = state.allCharts[id];
      if (only) {
        // only update a specific node's status
        chart.nodes[only].properties.status = status;
      } else if (all) {
        // update all node statuses
        Object.keys(chart.nodes).forEach(
          name => (chart.nodes[name].properties.status = status),
        );
      }
    },
  ),
  removeLink: action((state, linkId) => {
    // this action is used when the OpenChannel/ChangeBackend modals are closed.
    // remove the link created in the chart since a new one will be created
    // when the channels are fetched
    delete state.allCharts[state.activeId].links[linkId];
  }),
  updateBackendLink: action((state, { lnName, backendName }) => {
    const chart = state.allCharts[state.activeId];
    // remove the old ln -> backend link
    const prevLink = Object.values(chart.links).find(
      l => l.from.nodeId === lnName && l.from.portId === 'backend',
    );
    if (prevLink) delete chart.links[prevLink.id];
    // create a new link using the standard naming convention
    const newId = `${lnName}-${backendName}`;
    chart.links[newId] = {
      id: newId,
      from: { nodeId: lnName, portId: 'backend' },
      to: { nodeId: backendName, portId: 'backend' },
      properties: {
        type: 'backend',
      },
    };
  }),
  removeNode: action((state, nodeId) => {
    const chart = state.allCharts[state.activeId];
    if (chart.selected && chart.selected.id === nodeId) {
      chart.selected = {};
    }
    delete chart.nodes[nodeId];
    Object.values(chart.links).forEach(link => {
      if ([link.to.nodeId, link.from.nodeId].includes(nodeId)) {
        delete chart.links[link.id];
      }
    });
  }),
  addNode: action((state, { newNode, position }) => {
    const chart = state.allCharts[state.activeId];
    const { node, link } =
      newNode.type === 'lightning'
        ? createLightningChartNode(newNode)
        : newNode.type === 'bitcoin'
        ? createBitcoinChartNode(newNode)
        : createTarodChartNode(newNode as TarodNode);
    node.position = position;
    chart.nodes[node.id] = node;
    if (link) chart.links[link.id] = link;
  }),
  onLinkCompleteListener: thunkOn(
    actions => actions.onLinkComplete,
    (actions, { payload }, { getState, getStoreState, getStoreActions }) => {
      const { activeId, activeChart } = getState();
      const { linkId, fromNodeId, toNodeId, fromPortId, toPortId } = payload;
      if (!activeChart.links[linkId]) return;
      const fromNode = activeChart.nodes[fromNodeId];
      const toNode = activeChart.nodes[toNodeId];

      const showError = (errorMsg: string) => {
        actions.removeLink(linkId);
        getStoreActions().app.notify({
          message: l('linkErrTitle'),
          error: new Error(errorMsg),
        });
      };
      let network: Network;
      try {
        network = getStoreState().network.networkById(activeId);
      } catch (error: any) {
        return showError(error);
      }
      if (fromNode.type === 'lightning' && toNode.type === 'lightning') {
        // opening a channel
        if (
          network.status !== Status.Started ||
          fromNode.properties.status !== Status.Started ||
          toNode.properties.status !== Status.Started
        ) {
          return showError(l('linkErrNotStarted'));
        }

        getStoreActions().modals.showOpenChannel({
          to: toNodeId,
          from: fromNodeId,
          linkId: linkId,
        });
      } else if (fromNode.type === 'bitcoin' && toNode.type === 'bitcoin') {
        // connecting bitcoin to bitcoin isn't supported
        return showError(l('linkErrBitcoin'));
      } else {
        // connecting an LN node to a bitcoin node
        if (fromPortId !== 'backend' || toPortId !== 'backend') {
          return showError(l('linkErrPorts'));
        }

        const lnName = fromNode.type === 'lightning' ? fromNodeId : toNodeId;
        const backendName = fromNode.type === 'lightning' ? toNodeId : fromNodeId;
        getStoreActions().modals.showChangeBackend({ lnName, backendName, linkId });
      }
    },
  ),
  onCanvasDropListener: thunkOn(
    actions => actions.onCanvasDrop,
    async (actions, { payload }, { getStoreState, getStoreActions }) => {
      const { data } = payload;
      const { activeId, activeChart } = getStoreState().designer;
      const network = getStoreState().network.networkById(activeId);
      if (![Status.Started, Status.Stopped].includes(network.status)) {
        getStoreActions().app.notify({
          message: l('dropErrTitle'),
          error: new Error(l('dropErrMsg')),
        });
        // remove the loading node added in onCanvasDrop
        actions.removeNode(LOADING_NODE_ID);
      } else if (
        ['LND', 'c-lightning', 'eclair', 'bitcoind', 'tarod'].includes(data.type)
      ) {
        const { addNode, toggleNode } = getStoreActions().network;
        try {
          const newNode = await addNode({
            id: activeId,
            type: data.type,
            version: data.version,
            customId: data.customId,
          });
          actions.addNode({
            newNode,
            position: activeChart.nodes[LOADING_NODE_ID].position,
          });
          if (network.status === Status.Started) {
            await toggleNode(newNode);
          }
        } catch (error: any) {
          getStoreActions().app.notify({
            message: l('dropErrTitle'),
            error,
          });
          return;
        } finally {
          // remove the loading node added in onCanvasDrop
          actions.removeNode(LOADING_NODE_ID);
        }
        actions.redrawChart();
      }
    },
  ),
  zoomIn: action(state => {
    const chart = state.allCharts[state.activeId];
    chart.scale = chart.scale + 0.1;
  }),
  zoomOut: action(state => {
    const chart = state.allCharts[state.activeId];
    chart.scale = chart.scale - 0.1;
  }),
  zoomReset: action(state => {
    const chart = state.allCharts[state.activeId];
    chart.offset = { x: 0, y: 0 };
    chart.scale = 1;
  }),
  onDragNode: action((state, { config, data, id }) => {
    const chart = state.allCharts[state.activeId];
    if (chart.nodes[id]) {
      chart.nodes[id] = {
        ...chart.nodes[id],
        position: snap({ x: data.x, y: data.y }, config),
      };
    }
  }),
  onDragNodeStop: action(
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    () => {},
  ),
  onDragCanvas: action((state, { config, data }) => {
    const chart = state.allCharts[state.activeId];
    chart.offset = snap({ x: data.positionX, y: data.positionY }, config);
  }),
  onDragCanvasStop: action(
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    () => {},
  ),
  onLinkStart: action((state, { linkId, fromNodeId, fromPortId }) => {
    const chart = state.allCharts[state.activeId];
    chart.links[linkId] = {
      id: linkId,
      from: {
        nodeId: fromNodeId,
        portId: fromPortId,
      },
      to: {},
      properties: {
        type: 'link-start',
      },
    };
  }),
  onLinkMove: action((state, { linkId, toPosition }) => {
    const chart = state.allCharts[state.activeId];
    const link = chart.links[linkId];
    link.to.position = toPosition;
    chart.links[linkId] = { ...link };
  }),
  onLinkComplete: action((state, args) => {
    const chart = state.allCharts[state.activeId];
    const { linkId, fromNodeId, fromPortId, toNodeId, toPortId, config = {} } = args;
    if (
      (config.validateLink ? config.validateLink({ ...args, chart }) : true) &&
      fromNodeId !== toNodeId &&
      [fromNodeId, fromPortId].join() !== [toNodeId, toPortId].join()
    ) {
      chart.links[linkId].to = {
        nodeId: toNodeId,
        portId: toPortId,
      };
    } else {
      delete chart.links[linkId];
    }
  }),
  onLinkCancel: action((state, { linkId }) => {
    const chart = state.allCharts[state.activeId];
    delete chart.links[linkId];
  }),
  onLinkMouseEnter: action((state, { linkId }) => {
    const chart = state.allCharts[state.activeId];
    // Set the link to hover
    const link = chart.links[linkId];
    // Set the connected ports to hover
    if (link.to.nodeId && link.to.portId) {
      if (chart.hovered.type !== 'link' || chart.hovered.id !== linkId) {
        chart.hovered = {
          type: 'link',
          id: linkId,
        };
      }
    }
  }),
  onLinkMouseLeave: action((state, { linkId }) => {
    const chart = state.allCharts[state.activeId];
    const link = chart.links[linkId];
    // Set the connected ports to hover
    if (link.to.nodeId && link.to.portId) {
      chart.hovered = {};
    }
  }),
  onLinkClick: action((state, { linkId }) => {
    const chart = state.allCharts[state.activeId];
    if (chart.selected.id !== linkId || chart.selected.type !== 'link') {
      chart.selected = {
        type: 'link',
        id: linkId,
      };
    }
  }),
  onCanvasClick: action(state => {
    const chart = state.allCharts[state.activeId];
    if (chart.selected.id) {
      chart.selected = {};
    }
  }),
  onDeleteKey: action(state => {
    const chart = state.allCharts[state.activeId];
    if (chart.selected) {
      chart.selected = {};
    }
  }),
  onNodeClick: action((state, { nodeId }) => {
    const chart = state.allCharts[state.activeId];
    if (chart.selected.id !== nodeId || chart.selected.type !== 'node') {
      chart.selected = {
        type: 'node',
        id: nodeId,
      };
    }
  }),
  getSelectedNode: action(state => {
    const chart = state.allCharts[state.activeId];
  }),
  onNodeDoubleClick: action((state, { nodeId }) => {
    const chart = state.allCharts[state.activeId];
    if (chart.selected.id !== nodeId || chart.selected.type !== 'node') {
      chart.selected = {
        type: 'node',
        id: nodeId,
      };
    }
  }),
  onNodeMouseEnter: action((state, { nodeId }) => {
    const chart = state.allCharts[state.activeId];
    chart.hovered = {
      type: 'node',
      id: nodeId,
    };
  }),
  onNodeMouseLeave: action((state, { nodeId }) => {
    const chart = state.allCharts[state.activeId];
    if (chart.hovered.type === 'node' && chart.hovered.id === nodeId) {
      chart.hovered = {};
    }
  }),
  onNodeSizeChange: action((state, { nodeId, size }) => {
    const chart = state.allCharts[state.activeId];
    chart.nodes[nodeId].size = {
      ...size,
    };
  }),
  onPortPositionChange: action((state, { node: nodeToUpdate, port, el, nodesEl }) => {
    const chart = state.allCharts[state.activeId];
    if (nodeToUpdate.size) {
      // rotate the port's position based on the node's orientation prop (angle)
      const center = {
        x: nodeToUpdate.size.width / 2,
        y: nodeToUpdate.size.height / 2,
      };
      const current = {
        x: el.offsetLeft + nodesEl.offsetLeft + el.offsetWidth / 2,
        y: el.offsetTop + nodesEl.offsetTop + el.offsetHeight / 2,
      };
      const angle = nodeToUpdate.orientation || 0;
      const position = rotate(center, current, angle);

      const node = chart.nodes[nodeToUpdate.id];
      node.ports[port.id].position = {
        x: position.x,
        y: position.y,
      };

      chart.nodes[nodeToUpdate.id] = { ...node };
    }
  }),
  onCanvasDrop: action((state, { config, data, position }) => {
    const chart = state.allCharts[state.activeId];
    chart.nodes[LOADING_NODE_ID] = {
      id: LOADING_NODE_ID,
      position: snap(position, config),
      type: data.type,
      ports: {},
      properties: {},
    };
  }),
  onZoomCanvas: action((state, { config, data }) => {
    const chart = state.allCharts[state.activeId];
    chart.offset = snap({ x: data.positionX, y: data.positionY }, config);
    chart.scale = data.scale;
  }),
};

export default designerModel;
