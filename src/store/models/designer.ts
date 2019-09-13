import {
  IChart,
  IConfig,
  IOnCanvasClick,
  IOnCanvasDrop,
  IOnDeleteKey,
  IOnDragCanvas,
  IOnDragNode,
  IOnLinkCancel,
  IOnLinkClick,
  IOnLinkComplete,
  IOnLinkMouseEnter,
  IOnLinkMouseLeave,
  IOnLinkMove,
  IOnLinkStart,
  IOnNodeClick,
  IOnNodeSizeChange,
  IOnPortPositionChange,
  IPosition,
} from '@mrblenny/react-flow-chart';
import { Action, action } from 'easy-peasy';
import { Network } from 'types';
import btclogo from 'resources/bitcoin.svg';
import lndlogo from 'resources/lnd.png';

export interface DesignerModel {
  activeNetworkId: number;
  chart: IChart;
  initialize: Action<DesignerModel, Network>;
  setChart: Action<DesignerModel, IChart>;
  onDragNode: Action<DesignerModel, Parameters<IOnDragNode>[0]>;
  onDragCanvas: Action<DesignerModel, Parameters<IOnDragCanvas>[0]>;
  onCanvasDrop: Action<DesignerModel, Parameters<IOnCanvasDrop>[0]>;
  onCanvasClick: Action<DesignerModel, Parameters<IOnCanvasClick>[0]>;
  onLinkStart: Action<DesignerModel, Parameters<IOnLinkStart>[0]>;
  onLinkMove: Action<DesignerModel, Parameters<IOnLinkMove>[0]>;
  onLinkClick: Action<DesignerModel, Parameters<IOnLinkClick>[0]>;
  onLinkComplete: Action<DesignerModel, Parameters<IOnLinkComplete>[0]>;
  onLinkCancel: Action<DesignerModel, Parameters<IOnLinkCancel>[0]>;
  onLinkMouseEnter: Action<DesignerModel, Parameters<IOnLinkMouseEnter>[0]>;
  onLinkMouseLeave: Action<DesignerModel, Parameters<IOnLinkMouseLeave>[0]>;
  onPortPositionChange: Action<DesignerModel, Parameters<IOnPortPositionChange>[0]>;
  onDeleteKey: Action<DesignerModel, Parameters<IOnDeleteKey>[0]>;
  onNodeClick: Action<DesignerModel, Parameters<IOnNodeClick>[0]>;
  onNodeSizeChange: Action<DesignerModel, Parameters<IOnNodeSizeChange>[0]>;
}

const v4 = () => new Date().getTime().toString();
const snap = (position: IPosition, config?: IConfig): IPosition =>
  config && config.snapToGrid
    ? { x: Math.round(position.x / 20) * 20, y: Math.round(position.y / 20) * 20 }
    : position;
// center = rotation center
// current = current position
// x, y = rotated positions
// angle = angle of rotation
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

const EMPTY_CHART: IChart = {
  offset: { x: 0, y: 0 },
  nodes: {},
  links: {},
  selected: {},
  hovered: {},
};

const appModel: DesignerModel = {
  activeNetworkId: 0,
  chart: { ...EMPTY_CHART },
  initialize: action((state, network) => {
    state.activeNetworkId = network.id;
    state.chart.offset = EMPTY_CHART.offset;
    state.chart.selected = {};
    state.chart.hovered = {};
    Object.keys(state.chart.nodes).forEach(k => delete state.chart.nodes[k]);
    Object.keys(state.chart.links).forEach(k => delete state.chart.links[k]);

    network.nodes.bitcoin.forEach(n => {
      state.chart.nodes[n.name] = {
        id: n.name,
        type: 'output-only',
        position: { x: n.id * 250 + 200, y: 400 },
        ports: {
          backend: { id: 'backend', type: 'input' },
        },
        properties: {
          status: n.status,
          icon: btclogo,
        },
      };
    });

    network.nodes.lightning.forEach(n => {
      state.chart.nodes[n.name] = {
        id: n.name,
        type: 'input-output',
        position: { x: n.id * 250 + 50, y: n.id % 2 === 0 ? 100 : 200 },
        ports: {
          port1: { id: 'port1', type: 'left' },
          port2: { id: 'port2', type: 'right' },
          backend: { id: 'backend', type: 'output' },
        },
        properties: {
          status: n.status,
          icon: lndlogo,
        },
      };

      const linkName = `${n.name}-${n.backendName}`;
      state.chart.links[linkName] = {
        id: linkName,
        from: { nodeId: n.name, portId: 'backend' },
        to: { nodeId: n.backendName, portId: 'backend' },
      };
    });
  }),
  setChart: action((state, chart) => {
    state.chart = chart;
  }),
  onDragNode: action(({ chart }, { config, data, id }) => {
    const nodechart = chart.nodes[id];

    if (nodechart) {
      chart.nodes[id] = {
        ...nodechart,
        position: snap(data, config),
      };
    }
  }),
  onDragCanvas: action(({ chart }, { config, data }) => {
    chart.offset = snap(data, config);
  }),
  onCanvasDrop: action(({ chart }, { config, data, position }) => {
    const id = v4();
    chart.nodes[id] = {
      id,
      position: snap(position, config),
      orientation: data.orientation || 0,
      type: data.type,
      ports: data.ports,
      properties: data.properties,
    };
  }),
  onCanvasClick: action(({ chart }) => {
    if (chart.selected.id) {
      chart.selected = {};
    }
  }),
  onLinkStart: action(({ chart }, { linkId, fromNodeId, fromPortId }) => {
    chart.links[linkId] = {
      id: linkId,
      from: {
        nodeId: fromNodeId,
        portId: fromPortId,
      },
      to: {},
    };
  }),
  onLinkMove: action(({ chart }, { linkId, toPosition }) => {
    const link = chart.links[linkId];
    link.to.position = toPosition;
    chart.links[linkId] = { ...link };
  }),
  onLinkClick: action(({ chart }, { linkId }) => {
    if (chart.selected.id !== linkId || chart.selected.type !== 'link') {
      chart.selected = {
        type: 'link',
        id: linkId,
      };
    }
  }),
  onLinkComplete: action(({ chart }, payload) => {
    const { linkId, fromNodeId, fromPortId, toNodeId, toPortId, config = {} } = payload;
    if (
      (config.validateLink ? config.validateLink({ ...payload, chart: chart }) : true) &&
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
  onLinkCancel: action(({ chart }, { linkId }) => {
    delete chart.links[linkId];
  }),
  onLinkMouseEnter: action(({ chart }, { linkId }) => {
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
  onLinkMouseLeave: action(({ chart }, { linkId }) => {
    const link = chart.links[linkId];
    // Set the connected ports to hover
    if (link.to.nodeId && link.to.portId) {
      chart.hovered = {};
    }
  }),
  onPortPositionChange: action(({ chart }, { node: nodeToUpdate, port, el, nodesEl }) => {
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
  onDeleteKey: action(({ chart }) => {
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
  onNodeClick: action(({ chart }, { nodeId }) => {
    if (chart.selected.id !== nodeId || chart.selected.type !== 'node') {
      chart.selected = {
        type: 'node',
        id: nodeId,
      };
    }
  }),
  onNodeSizeChange: action(({ chart }, { nodeId, size }) => {
    chart.nodes[nodeId] = {
      ...chart.nodes[nodeId],
      size,
    };
  }),
};

export default appModel;
