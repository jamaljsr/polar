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
import { LndNode, Status } from 'shared/types';
import { Network, StoreInjections } from 'types';
import { createLightningChartNode, rotate, snap, updateChartFromLnd } from 'utils/chart';
import { LOADING_NODE_ID } from 'utils/constants';
import { groupNodes } from 'utils/network';
import { prefixTranslation } from 'utils/translate';
import { RootModel } from './';

const { l } = prefixTranslation('store.models.designer');

export interface DesignerModel {
  activeId: number;
  allCharts: Record<number, IChart>;
  redraw: boolean;
  activeChart: Computed<DesignerModel, IChart>;
  setActiveId: Action<DesignerModel, number>;
  setAllCharts: Action<DesignerModel, Record<number, IChart>>;
  addChart: Action<DesignerModel, { id: number; chart: IChart }>;
  removeChart: Action<DesignerModel, number>;
  redrawChart: Action<DesignerModel>;
  syncChart: Thunk<DesignerModel, Network, StoreInjections, RootModel>;
  onNetworkSetStatus: ActionOn<DesignerModel, RootModel>;
  removeLink: Action<DesignerModel, string>;
  removeNode: Action<DesignerModel, string>;
  addLndNode: Action<DesignerModel, { lndNode: LndNode; position: IPosition }>;
  onLinkCompleteListener: ThunkOn<DesignerModel, StoreInjections, RootModel>;
  onCanvasDropListener: ThunkOn<DesignerModel, StoreInjections, RootModel>;
  // Flowchart component callbacks
  onDragNode: Action<DesignerModel, Parameters<RFC.IOnDragNode>[0]>;
  onDragCanvas: Action<DesignerModel, Parameters<RFC.IOnDragCanvas>[0]>;
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
  onNodeSizeChange: Action<DesignerModel, Parameters<RFC.IOnNodeSizeChange>[0]>;
  onPortPositionChange: Action<DesignerModel, Parameters<RFC.IOnPortPositionChange>[0]>;
  onCanvasDrop: Action<DesignerModel, Parameters<RFC.IOnCanvasDrop>[0]>;
}

const designerModel: DesignerModel = {
  // state properties
  activeId: -1,
  allCharts: {},
  redraw: false,
  // computed properties/functions
  activeChart: computed(state => state.allCharts[state.activeId]),
  // reducer actions (mutations allowed thx to immer)
  setActiveId: action((state, networkId) => {
    if (!state.allCharts[networkId]) throw new Error(l('notFoundError', { networkId }));
    state.activeId = networkId;
  }),
  setAllCharts: action((state, charts) => {
    state.allCharts = charts;
  }),
  addChart: action((state, { id, chart }) => {
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
      // fetch data from all of the nodes
      await Promise.all(groupNodes(network).lnd.map(getStoreActions().lnd.getAllInfo));

      const nodesData = getStoreState().lnd.nodes;
      const { allCharts } = getState();
      // sync the chart with data from all of the nodes
      const chart = updateChartFromLnd(allCharts[network.id], nodesData);
      actions.setAllCharts({
        ...allCharts,
        [network.id]: chart,
      });
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
    // this action is used when the OpenChannel modal is closed.
    // remove the link created in the chart since a new one will
    // be created when the channels are fetched
    delete state.allCharts[state.activeId].links[linkId];
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
  addLndNode: action((state, { lndNode, position }) => {
    const chart = state.allCharts[state.activeId];
    const { node, link } = createLightningChartNode(lndNode);
    node.position = position;
    chart.nodes[node.id] = node;
    chart.links[link.id] = link;
  }),
  onLinkCompleteListener: thunkOn(
    actions => actions.onLinkComplete,
    (actions, { payload }, { getState, getStoreState, getStoreActions }) => {
      const { activeId, activeChart } = getState();
      const { linkId, fromNodeId, toNodeId } = payload;
      if (!activeChart.links[linkId]) return;
      const fromNode = activeChart.nodes[fromNodeId];
      const toNode = activeChart.nodes[toNodeId];

      const showError = (error: Error) => {
        actions.removeLink(linkId);
        getStoreActions().app.notify({
          message: l('linkErrTitle'),
          error,
        });
      };
      if (fromNode.type !== 'lightning' || toNode.type !== 'lightning') {
        return showError(new Error(l('linkErrNodes')));
      }
      let network: Network;
      try {
        network = getStoreState().network.networkById(activeId);
      } catch (error) {
        return showError(error);
      }
      if (
        network.status !== Status.Started ||
        fromNode.properties.status !== Status.Started ||
        toNode.properties.status !== Status.Started
      ) {
        return showError(new Error(l('linkErrNotStarted')));
      }

      getStoreActions().modals.showOpenChannel({
        to: toNodeId,
        from: fromNodeId,
        linkId: linkId,
      });
    },
  ),
  onCanvasDropListener: thunkOn(
    actions => actions.onCanvasDrop,
    async (actions, { payload }, { getStoreState, getStoreActions }) => {
      const { data, position } = payload;
      const { activeId } = getStoreState().designer;
      const { networkById } = getStoreState().network;
      const network = networkById(activeId);
      if (![Status.Started, Status.Stopped].includes(network.status)) {
        getStoreActions().app.notify({
          message: l('dropErrTitle'),
          error: new Error(l('dropErrMsg')),
        });
      } else if (data.type === 'lnd') {
        const { addLndNode, start } = getStoreActions().network;
        const lndNode = await addLndNode({ id: activeId, version: data.version });
        actions.addLndNode({ lndNode, position });
        actions.redrawChart();
        if (network.status === Status.Started) {
          await start(activeId);
        }
      }

      // remove the loading node added in onCanvasDrop
      actions.removeNode(LOADING_NODE_ID);
    },
  ),
  // TODO: add unit tests for the actions below
  // These actions are excluded from test coverage analysis because
  // they were copied no modifications from
  // https://github.com/MrBlenny/react-flow-chart/blob/master/src/container/actions.ts
  onDragNode: action(
    /* istanbul ignore next */
    (state, { config, data, id }) => {
      const chart = state.allCharts[state.activeId];
      if (chart.nodes[id]) {
        chart.nodes[id] = {
          ...chart.nodes[id],
          position: snap(data, config),
        };
      }
    },
  ),
  onDragCanvas: action(
    /* istanbul ignore next */
    (state, { config, data }) => {
      const chart = state.allCharts[state.activeId];
      chart.offset = snap(data, config);
    },
  ),
  onLinkStart: action(
    /* istanbul ignore next */
    (state, { linkId, fromNodeId, fromPortId }) => {
      const chart = state.allCharts[state.activeId];
      chart.links[linkId] = {
        id: linkId,
        from: {
          nodeId: fromNodeId,
          portId: fromPortId,
        },
        to: {},
      };
    },
  ),
  onLinkMove: action(
    /* istanbul ignore next */
    (state, { linkId, toPosition }) => {
      const chart = state.allCharts[state.activeId];
      const link = chart.links[linkId];
      link.to.position = toPosition;
      chart.links[linkId] = { ...link };
    },
  ),
  onLinkComplete: action(
    /* istanbul ignore next */
    (state, args) => {
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
    },
  ),
  onLinkCancel: action(
    /* istanbul ignore next */
    (state, { linkId }) => {
      const chart = state.allCharts[state.activeId];
      delete chart.links[linkId];
    },
  ),
  onLinkMouseEnter: action(
    /* istanbul ignore next */
    (state, { linkId }) => {
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
    },
  ),
  onLinkMouseLeave: action(
    /* istanbul ignore next */
    (state, { linkId }) => {
      const chart = state.allCharts[state.activeId];
      const link = chart.links[linkId];
      // Set the connected ports to hover
      if (link.to.nodeId && link.to.portId) {
        chart.hovered = {};
      }
    },
  ),
  onLinkClick: action(
    /* istanbul ignore next */
    (state, { linkId }) => {
      const chart = state.allCharts[state.activeId];
      if (chart.selected.id !== linkId || chart.selected.type !== 'link') {
        chart.selected = {
          type: 'link',
          id: linkId,
        };
      }
    },
  ),
  onCanvasClick: action(
    /* istanbul ignore next */
    state => {
      const chart = state.allCharts[state.activeId];
      if (chart.selected.id) {
        chart.selected = {};
      }
    },
  ),
  onDeleteKey: action(
    /* istanbul ignore next */
    state => {
      const chart = state.allCharts[state.activeId];
      if (chart.selected.type === 'node' && chart.selected.id) {
        const node = chart.nodes[chart.selected.id];
        // Delete the connected links
        Object.keys(chart.links).forEach(linkId => {
          const link = chart.links[linkId];
          if (link.from.nodeId === node.id || link.to.nodeId === node.id) {
            delete chart.links[link.id];
          }
        });
        // Delete the node
        delete chart.nodes[chart.selected.id];
      } else if (chart.selected.type === 'link' && chart.selected.id) {
        delete chart.links[chart.selected.id];
      }
      if (chart.selected) {
        chart.selected = {};
      }
    },
  ),
  onNodeClick: action(
    /* istanbul ignore next */
    (state, { nodeId }) => {
      const chart = state.allCharts[state.activeId];
      if (chart.selected.id !== nodeId || chart.selected.type !== 'node') {
        chart.selected = {
          type: 'node',
          id: nodeId,
        };
      }
    },
  ),
  onNodeSizeChange: action(
    /* istanbul ignore next */
    (state, { nodeId, size }) => {
      const chart = state.allCharts[state.activeId];
      chart.nodes[nodeId].size = {
        ...size,
      };
    },
  ),
  onPortPositionChange: action(
    /* istanbul ignore next */
    (state, { node: nodeToUpdate, port, el, nodesEl }) => {
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
    },
  ),
  onCanvasDrop: action(
    /* istanbul ignore next */
    (state, { config, data, position }) => {
      const chart = state.allCharts[state.activeId];
      chart.nodes[LOADING_NODE_ID] = {
        id: LOADING_NODE_ID,
        position: snap(position, config),
        type: data.type,
        ports: {},
        properties: {},
      };
    },
  ),
};

export default designerModel;
