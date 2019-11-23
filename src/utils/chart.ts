import { IChart, IConfig, ILink, INode, IPosition } from '@mrblenny/react-flow-chart';
import { Channel, PendingChannel } from '@radar/lnrpc';
import { BitcoinNode, LightningNode } from 'shared/types';
import { LightningNodeChannel } from 'lib/lightning/types';
import { LndNodeMapping } from 'store/models/lnd';
import { Network } from 'types';
import btclogo from 'resources/bitcoin.svg';
import clightningLogo from 'resources/clightning.png';
import lndLogo from 'resources/lnd.png';

export interface LinkProperties {
  type: 'backend' | 'pending-channel' | 'open-channel';
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
      backend: { id: 'backend', type: 'output' },
    },
    size: { width: 200, height: 36 },
    properties: {
      status: ln.status,
      icon: logo,
    },
  };

  const link: ILink = {
    id: `${ln.name}-backend`,
    from: { nodeId: ln.name, portId: 'backend' },
    to: { nodeId: ln.backendName, portId: 'backend' },
    properties: {
      type: 'backend',
    },
  };

  return { node, link };
};

export const createBitcoinChartNode = (node: BitcoinNode): INode => {
  return {
    id: node.name,
    type: 'bitcoin',
    position: { x: node.id * 250 + 200, y: 400 },
    ports: {
      backend: { id: 'backend', type: 'input' },
    },
    size: { width: 200, height: 36 },
    properties: {
      status: node.status,
      icon: btclogo,
    },
  };
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
    chart.nodes[n.name] = createBitcoinChartNode(n);
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

const mapOpenChannel = (chan: Channel): LightningNodeChannel => ({
  pending: false,
  uniqueId: chan.channelPoint.slice(-12),
  channelPoint: chan.channelPoint,
  pubkey: chan.remotePubkey,
  capacity: chan.capacity,
  localBalance: chan.localBalance,
  remoteBalance: chan.remoteBalance,
  status: 'Open',
});

const mapPendingChannel = (status: string) => (
  chan: PendingChannel,
): LightningNodeChannel => ({
  pending: true,
  uniqueId: chan.channelPoint.slice(-12),
  channelPoint: chan.channelPoint,
  pubkey: chan.remoteNodePub,
  capacity: chan.capacity,
  localBalance: chan.localBalance,
  remoteBalance: chan.remoteBalance,
  status,
});

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

export const updateChartFromLnd = (chart: IChart, lndData: LndNodeMapping): IChart => {
  // create a mapping of node name to pubkey for lookups
  const pubkeys: Record<string, string> = {};
  Object.entries(lndData).forEach(([name, data]) => {
    if (!data.info || !data.info.pubkey) return;
    pubkeys[data.info.pubkey] = name;
  });

  const nodes = { ...chart.nodes };
  const links = { ...chart.links };
  const createdLinkIds: string[] = [];

  // update the node and links for each node
  Object.entries(lndData).forEach(([fromName, data]) => {
    const fromNode = nodes[fromName];

    if (data.channels) {
      const { open, opening, closing, forceClosing, waitingClose } = data.channels;

      // merge all of the channel types into one array
      const pluckChan = (c: any) => c.channel as PendingChannel;
      const allChannels = [
        ...open.filter(c => c.initiator).map(mapOpenChannel),
        ...opening.map(pluckChan).map(mapPendingChannel('Opening')),
        ...closing.map(pluckChan).map(mapPendingChannel('Closing')),
        ...forceClosing.map(pluckChan).map(mapPendingChannel('Force Closing')),
        ...waitingClose.map(pluckChan).map(mapPendingChannel('Waiting to Close')),
      ];

      allChannels
        // ignore channels to nodes that no longer exist in the network
        .filter(c => !!pubkeys[c.pubkey])
        .forEach(channel => {
          updateLinksAndPorts(channel, pubkeys, nodes, fromNode, links);
          createdLinkIds.push(channel.uniqueId);
        });

      nodes[fromName] = {
        ...fromNode,
      };
    }
  });

  // remove links for channels that no longer exist
  Object.keys(links).forEach(linkId => {
    // don't remove links for existing channels
    if (createdLinkIds.includes(linkId)) return;
    // don't remove links to bitcoin nodes
    if (linkId.endsWith('-backend')) return;
    // delete all other links
    delete links[linkId];
  });

  // remove ports for channels that no longer exist
  Object.values(nodes).forEach(node => {
    Object.keys(node.ports).forEach(portId => {
      // don't remove special ports
      if (['empty-left', 'empty-right', 'backend'].includes(portId)) return;
      // don't remove ports for existing channels
      if (createdLinkIds.includes(portId)) return;
      // delete all other ports
      delete node.ports[portId];
    });
  });

  // resize chart nodes if necessary to fit new ports
  Object.keys(lndData).forEach(name => updateNodeSize(nodes[name]));

  return {
    ...chart,
    nodes,
    links,
    selected: {},
  };
};
