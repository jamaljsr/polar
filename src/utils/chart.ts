import { IChart, IConfig, ILink, INode, IPosition } from '@mrblenny/react-flow-chart';
import { BitcoinNode, LightningNode, TapdNode, TapNode } from 'shared/types';
import { LightningNodeChannel } from 'lib/lightning/types';
import { LightningNodeMapping } from 'store/models/lightning';
import { Network } from 'types';
import { dockerConfigs } from './constants';

export interface LinkProperties {
  type: 'backend' | 'pending-channel' | 'open-channel' | 'btcpeer' | 'lndbackend';
  channelPoint: string;
  capacity: string;
  fromBalance: string;
  toBalance: string;
  direction: 'ltr' | 'rtl';
  status: string;
  isPrivate: boolean;
  assets?: LightningNodeChannel['assets'];
}

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

export const snap = (position: IPosition, config?: IConfig) => {
  let offset = { x: position.x, y: position.y };
  if (config && config.snapToGrid) {
    offset = {
      x: Math.round(position.x / 20) * 20,
      y: Math.round(position.y / 20) * 20,
    };
  }
  return offset;
};

// Adds a gap from the top & left edges of the canvas
const baseline = { x: 100, y: 100 };
// For nodes that are on the same row / column, stagger them by this amount
const stagger = { x: 50, y: 100 };
// The amount of space between each node
const space = { x: 250, y: 200 };

export const createLightningChartNode = (ln: LightningNode, yOffset = 0) => {
  const position: IPosition = {
    x: ln.id * space.x + stagger.x,
    y: baseline.y + yOffset + (ln.id % 2 === 0 ? 0 : stagger.y),
  };
  const node: INode = {
    id: ln.name,
    type: 'lightning',
    position,
    ports: {
      'empty-left': { id: 'empty-left', type: 'left' },
      'empty-right': { id: 'empty-right', type: 'right' },
      backend: { id: 'backend', type: 'bottom' },
    },
    size: { width: 200, height: 36 },
    properties: {
      status: ln.status,
      icon: dockerConfigs[ln.implementation].logo,
    },
  };

  if (ln.implementation === 'LND') {
    node.ports['lndbackend'] = { id: 'lndbackend', type: 'top' };
  }

  const link: ILink = {
    id: `${ln.name}-${ln.backendName}`,
    from: { nodeId: ln.name, portId: 'backend' },
    to: { nodeId: ln.backendName, portId: 'backend' },
    properties: {
      type: 'backend',
    },
  };

  return { node, link };
};

export const createTapdChartNode = (tap: TapNode, chart?: IChart) => {
  const position: IPosition = {
    x: tap.id * space.x + baseline.x,
    y: baseline.y + (tap.id % 2 === 0 ? 0 : stagger.y),
  };
  const node: INode = {
    id: tap.name,
    type: 'tap',
    position,
    ports: {
      lndbackend: { id: 'lndbackend', type: 'bottom' },
    },
    size: { width: 200, height: 36 },
    properties: {
      status: tap.status,
      icon: dockerConfigs[tap.implementation].logo,
    },
  };

  let link: ILink | undefined = undefined;
  if (tap.implementation === 'tapd') {
    const tapd = tap as TapdNode;
    link = {
      id: `${tapd.name}-${tapd.lndName}`,
      from: { nodeId: tapd.name, portId: 'lndbackend' },
      to: { nodeId: tapd.lndName, portId: 'lndbackend' },
      properties: {
        type: 'lndbackend',
      },
    };

    if (chart?.nodes[tapd.lndName]) {
      const lndNode = chart.nodes[tapd.lndName];
      node.position = {
        x: lndNode.position.x + stagger.x,
        y: lndNode.position.y - space.y,
      };
    }
  }

  return { node, link };
};

export const createBitcoinChartNode = (btc: BitcoinNode, yOffset = 0) => {
  const position: IPosition = {
    x: btc.id * 250 + space.x,
    y: yOffset + space.y + space.y + (btc.id % 2 === 0 ? 0 : stagger.y),
  };
  const node: INode = {
    id: btc.name,
    type: 'bitcoin',
    position,
    ports: {
      backend: { id: 'backend', type: 'top' },
      'peer-left': { id: 'peer-left', type: 'left' },
      'peer-right': { id: 'peer-right', type: 'right' },
    },
    size: { width: 200, height: 36 },
    properties: {
      status: btc.status,
      icon: dockerConfigs[btc.implementation].logo,
    },
  };

  let link: ILink | undefined;
  // the first peer is always the prev node unless this is the first node in the network
  const peer = btc.peers[0];
  if (peer && btc.name > peer) {
    // only add one link from right to left (ex: 'backend3' > 'backend2')
    // we don't need links if this is the only node
    link = {
      id: `${peer}-${btc.name}`,
      from: { nodeId: peer, portId: 'peer-right' },
      to: { nodeId: btc.name, portId: 'peer-left' },
      properties: {
        type: 'btcpeer',
      },
    };
  }

  return { node, link };
};

export const initChartFromNetwork = (network: Network): IChart => {
  const chart: IChart = {
    offset: { x: 0, y: 0 },
    nodes: {},
    links: {},
    selected: {},
    hovered: {},
    scale: 1,
  };

  // determines if the LN and BTC nodes should start on the second or third row based on
  // if there are TAP nodes present
  const yOffset = network.nodes.tap.length > 0 ? space.y : 0;

  network.nodes.bitcoin.forEach(n => {
    const { node, link } = createBitcoinChartNode(n, yOffset);
    chart.nodes[node.id] = node;
    if (link) chart.links[link.id] = link;
  });

  network.nodes.lightning.forEach(n => {
    const { node, link } = createLightningChartNode(n, yOffset);
    chart.nodes[node.id] = node;
    chart.links[link.id] = link;
  });

  network.nodes.tap.forEach(n => {
    const { node, link } = createTapdChartNode(n, chart);
    chart.nodes[node.id] = node;
    if (link) chart.links[link.id] = link;
  });

  return chart;
};

const updateNodeSize = (node: INode) => {
  if (!node.size) node.size = { width: 200, height: 36 };
  const { ports, size } = node;
  const leftPorts = Object.values(ports).filter(p => p.type === 'left').length;
  const rightPorts = Object.values(ports).filter(p => p.type === 'right').length;
  const numPorts = Math.max(leftPorts, rightPorts, 1);
  node.size = {
    ...size,
    height: numPorts * 24 + 12,
  };
};

const updateLinksAndPorts = (
  chan: LightningNodeChannel,
  pubkeys: Record<string, string>,
  nodes: { [x: string]: INode },
  fromNode: INode,
  links: { [x: string]: ILink },
) => {
  // use the channel point as a unique id since pending channels do not have a channel id yet
  const chanId = chan.uniqueId;
  const toName = pubkeys[chan.pubkey];
  const toNode = nodes[toName];
  const fromOnLeftSide = fromNode.position.x < toNode.position.x;

  // create or update the port on the from node
  fromNode.ports[chanId] = {
    ...(fromNode.ports[chanId] || {}),
    id: chanId,
    type: fromOnLeftSide ? 'right' : 'left',
    properties: {
      nodeId: fromNode.id,
      initiator: true,
      hasAssets: !!chan.assets?.length,
    },
  };

  // create or update the port on the to node
  toNode.ports[chanId] = {
    ...(toNode.ports[chanId] || {}),
    id: chanId,
    type: fromOnLeftSide ? 'left' : 'right',
    properties: { nodeId: toNode.id, initiator: false, hasAssets: !!chan.assets?.length },
  };

  const properties: LinkProperties = {
    type: chan.pending ? 'pending-channel' : 'open-channel',
    channelPoint: chan.channelPoint,
    capacity: chan.capacity,
    fromBalance: chan.localBalance,
    toBalance: chan.remoteBalance,
    direction: fromOnLeftSide ? 'ltr' : 'rtl',
    status: chan.status,
    isPrivate: chan.isPrivate,
    assets: chan.assets,
  };

  // create or update the link
  links[chanId] = {
    ...(links[chanId] || {}),
    id: chanId,
    from: { nodeId: fromNode.id, portId: chanId },
    to: { nodeId: toName, portId: chanId },
    properties,
  };
};

export const updateChartFromNodes = (
  chart: IChart,
  network: Network,
  nodesData: LightningNodeMapping,
): IChart => {
  // create a mapping of node name to pubkey for lookups
  const pubkeys: Record<string, string> = {};
  Object.entries(nodesData).forEach(([name, data]) => {
    if (!data.info || !data.info.pubkey) return;
    pubkeys[data.info.pubkey] = name;
  });

  const nodes = { ...chart.nodes };
  const links = { ...chart.links };
  const linksToKeep: string[] = [];

  // update the node and links for each node
  Object.entries(nodesData).forEach(([fromName, data]) => {
    const fromNode = nodes[fromName];

    if (fromNode && data.channels) {
      data.channels
        // ignore channels to nodes that no longer exist in the network
        .filter(c => !!pubkeys[c.pubkey])
        .forEach(channel => {
          updateLinksAndPorts(channel, pubkeys, nodes, fromNode, links);
          linksToKeep.push(channel.uniqueId);
        });

      nodes[fromName] = {
        ...fromNode,
      };
    }
  });

  // ensure all lightning -> bitcoin backend links exist. one may have
  // been deleted if a bitcoin node was removed
  network.nodes.lightning.forEach(ln => {
    const id = `${ln.name}-${ln.backendName}`;
    if (!links[id]) {
      links[id] = {
        id,
        from: { nodeId: ln.name, portId: 'backend' },
        to: { nodeId: ln.backendName, portId: 'backend' },
        properties: {
          type: 'backend',
        },
      };
    }
    linksToKeep.push(id);
  });

  // ensure all bitcoin -> bitcoin peer links exist. they are deleted
  // when a bitcoin node in between two other nodes is removed
  network.nodes.bitcoin.forEach((btc, i) => {
    // do nothing for the first node
    if (i === 0) return;
    // the prev node should always be the first peer
    const peer = btc.peers[0];
    if (!peer) return;
    // link the curr node to the prev node
    const id = `${peer}-${btc.name}`;
    if (!links[id]) {
      links[id] = {
        id,
        from: { nodeId: peer, portId: 'peer-right' },
        to: { nodeId: btc.name, portId: 'peer-left' },
        properties: {
          type: 'btcpeer',
        },
      };
    }
    linksToKeep.push(id);
  });

  // ensure all tapd -> lnd backend links exists
  network.nodes.tap.forEach(tap => {
    const tapd = tap as TapdNode;
    const id = `${tapd.name}-${tapd.lndName}`;
    if (!links[id]) {
      links[id] = {
        id,
        from: { nodeId: tapd.name, portId: 'lndbackend' },
        to: { nodeId: tapd.lndName, portId: 'lndbackend' },
        properties: {
          type: 'lndbackend',
        },
      };
    }
    linksToKeep.push(id);
  });

  // remove links for channels that no longer exist
  Object.keys(links).forEach(linkId => {
    // don't remove links for existing channels
    if (linksToKeep.includes(linkId)) return;
    // delete all other links
    delete links[linkId];
  });

  // remove ports for channels that no longer exist
  Object.values(nodes).forEach(node => {
    Object.keys(node.ports).forEach(portId => {
      // don't remove special ports
      const special = [
        'empty-left',
        'empty-right',
        'backend',
        'peer-left',
        'peer-right',
        'lndbackend',
      ];
      if (special.includes(portId)) return;
      // don't remove ports for existing channels
      if (linksToKeep.includes(portId)) return;
      // delete all other ports
      delete node.ports[portId];
    });
  });

  // resize chart nodes if necessary to fit new ports
  Object.keys(nodesData).forEach(name => updateNodeSize(nodes[name]));

  const selected = chart.selected && chart.selected.type === 'node' ? chart.selected : {};
  return {
    ...chart,
    nodes,
    links,
    selected,
  };
};
