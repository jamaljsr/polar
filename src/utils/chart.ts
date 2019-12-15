import { IChart, IConfig, ILink, INode, IPosition } from '@mrblenny/react-flow-chart';
import { BitcoinNode, LightningNode } from 'shared/types';
import { LightningNodeChannel } from 'lib/lightning/types';
import { LightningNodeMapping } from 'store/models/lightning';
import { Network } from 'types';
import btclogo from 'resources/bitcoin.svg';
import clightningLogo from 'resources/clightning.png';
import lndLogo from 'resources/lnd.png';

export interface LinkProperties {
  type: 'backend' | 'pending-channel' | 'open-channel' | 'btcpeer';
  channelPoint: string;
  capacity: string;
  fromBalance: string;
  toBalance: string;
  direction: 'ltr' | 'rtl';
  status: string;
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

export const snap = (position: IPosition, config?: IConfig) =>
  config && config.snapToGrid
    ? { x: Math.round(position.x / 20) * 20, y: Math.round(position.y / 20) * 20 }
    : position;

export const createLightningChartNode = (ln: LightningNode) => {
  const logo = ln.implementation === 'c-lightning' ? clightningLogo : lndLogo;
  const node: INode = {
    id: ln.name,
    type: 'lightning',
    position: { x: ln.id * 250 + 50, y: ln.id % 2 === 0 ? 100 : 200 },
    ports: {
      'empty-left': { id: 'empty-left', type: 'left' },
      'empty-right': { id: 'empty-right', type: 'right' },
      backend: { id: 'backend', type: 'bottom' },
    },
    size: { width: 200, height: 36 },
    properties: {
      status: ln.status,
      icon: logo,
    },
  };

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

export const createBitcoinChartNode = (btc: BitcoinNode) => {
  const node: INode = {
    id: btc.name,
    type: 'bitcoin',
    position: { x: btc.id * 250 + 200, y: btc.id % 2 === 0 ? 400 : 500 },
    ports: {
      backend: { id: 'backend', type: 'top' },
      'peer-left': { id: 'peer-left', type: 'left' },
      'peer-right': { id: 'peer-right', type: 'right' },
    },
    size: { width: 200, height: 36 },
    properties: {
      status: btc.status,
      icon: btclogo,
    },
  };

  let link: ILink | undefined;
  // the first peer is always the prev node unless this is the first node in the network
  const peer = btc.peers[0];
  if (peer && btc.name > peer) {
    // only add one link from left to right (ex: 'backend2' < 'backend3')
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
  };

  network.nodes.bitcoin.forEach(n => {
    const { node, link } = createBitcoinChartNode(n);
    chart.nodes[node.id] = node;
    if (link) chart.links[link.id] = link;
  });

  network.nodes.lightning.forEach(n => {
    const { node, link } = createLightningChartNode(n);
    chart.nodes[node.id] = node;
    chart.links[link.id] = link;
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
    properties: { nodeId: fromNode.id, initiator: true },
  };

  // create or update the port on the to node
  toNode.ports[chanId] = {
    ...(toNode.ports[chanId] || {}),
    id: chanId,
    type: fromOnLeftSide ? 'left' : 'right',
    properties: { nodeId: toNode.id },
  };

  // create or update the link
  links[chanId] = {
    ...(links[chanId] || {}),
    id: chanId,
    from: { nodeId: fromNode.id, portId: chanId },
    to: { nodeId: toName, portId: chanId },
    properties: {
      type: chan.pending ? 'pending-channel' : 'open-channel',
      channelPoint: chan.channelPoint,
      capacity: chan.capacity,
      fromBalance: chan.localBalance,
      toBalance: chan.remoteBalance,
      direction: fromOnLeftSide ? 'ltr' : 'rtl',
      status: chan.status,
    },
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

    if (data.channels) {
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
      const special = ['empty-left', 'empty-right', 'backend', 'peer-left', 'peer-right'];
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
