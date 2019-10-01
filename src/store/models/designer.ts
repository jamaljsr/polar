import RFC, { IChart, IConfig, IPosition } from '@mrblenny/react-flow-chart';
import { Action, action, ActionOn, actionOn, Computed, computed } from 'easy-peasy';
import { RootModel } from './';

export const rotate = (
  center: IPosition,
  current: IPosition,
  angle: number,
): IPosition => {
  const radians = (Math.PI / 180) * angle;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  const x = cos * (current.x - center.x) + sin * (current.y - center.y) + center.x;
  const y = cos * (current.y - center.y) - sin * (current.x - center.x) + center.y;
  return { x, y };
};

const snap = (position: IPosition, config?: IConfig) =>
  config && config.snapToGrid
    ? { x: Math.round(position.x / 20) * 20, y: Math.round(position.y / 20) * 20 }
    : position;

export interface DesignerModel {
  activeId: number;
  allCharts: Record<number, IChart>;
  activeChart: Computed<DesignerModel, IChart>;
  setActiveId: Action<DesignerModel, number>;
  setAllCharts: Action<DesignerModel, Record<number, IChart>>;
  addChart: Action<DesignerModel, { id: number; chart: IChart }>;
  onSetStatus: ActionOn<DesignerModel, RootModel>;
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
  // computed properties/functions
  activeChart: computed(state => state.allCharts[state.activeId]),
  // reducer actions (mutations allowed thx to immer)
  setActiveId: action((state, networkId) => {
    if (!state.allCharts[networkId])
      throw new Error(`Chart not found for network with id ${networkId}`);
    state.activeId = networkId;
  }),
  setAllCharts: action((state, charts) => {
    state.allCharts = charts;
  }),
  addChart: action((state, { id, chart }) => {
    state.allCharts[id] = chart;
  }),
  onSetStatus: actionOn(
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
  onDragNode: action((state, { config, data, id }) => {
    const chart = state.allCharts[state.activeId];
    if (chart.nodes[id]) {
      chart.nodes[id] = {
        ...chart.nodes[id],
        position: snap(data, config),
      };
    }
  }),
  onDragCanvas: action((state, { config, data }) => {
    const chart = state.allCharts[state.activeId];
    chart.offset = snap(data, config);
  }),
  onLinkStart: action((state, { linkId, fromNodeId, fromPortId }) => {
    const chart = state.allCharts[state.activeId];
    chart.links[linkId] = {
      id: linkId,
      from: {
        nodeId: fromNodeId,
        portId: fromPortId,
      },
      to: {},
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
      const center = { x: nodeToUpdate.size.width / 2, y: nodeToUpdate.size.height / 2 };
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
    const id = Date.now().toString(); // TODO: v4();
    chart.nodes[id] = {
      id,
      position: snap(position, config),
      orientation: data.orientation || 0,
      type: data.type,
      ports: data.ports,
      properties: data.properties,
    };
  }),
};

export default designerModel;
