import { IChart, ILink, INode } from '@mrblenny/react-flow-chart';
import { Channel, PendingChannel } from '@radar/lnrpc';
import { LndNodeMapping } from 'store/models/lnd';
import { Network } from 'types';
import btclogo from 'resources/bitcoin.svg';
import lndlogo from 'resources/lnd.png';

export interface LinkProperties {
  type: 'backend' | 'pending-channel' | 'open-channel';
  capacity: 'string';
  fromBalance: 'string';
  toBalance: 'string';
  direction: 'ltr' | 'rtl';
}

export const initChartFromNetwork = (network: Network): IChart => {
  const chart: IChart = {
    offset: { x: 0, y: 0 },
    nodes: {},
    links: {},
    selected: {},
    hovered: {},
  };

  network.nodes.bitcoin.forEach(n => {
    chart.nodes[n.name] = {
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
    chart.nodes[n.name] = {
      id: n.name,
      type: 'input-output',
      position: { x: n.id * 250 + 50, y: n.id % 2 === 0 ? 100 : 200 },
      ports: {
        'empty-left': { id: 'empty-left', type: 'left' },
        'empty-right': { id: 'empty-right', type: 'right' },
        backend: { id: 'backend', type: 'output' },
      },
      properties: {
        status: n.status,
        icon: lndlogo,
      },
    };

    const linkName = `${n.name}-backend`;
    chart.links[linkName] = {
      id: linkName,
      from: { nodeId: n.name, portId: 'backend' },
      to: { nodeId: n.backendName, portId: 'backend' },
      properties: {
        type: 'backend',
      },
    };
  });

  return chart;
};

const updateNodeSize = (node: INode) => {
  if (node.size) {
    const { ports, size } = node;
    const leftPorts = Object.values(ports).filter(p => p.type === 'left').length;
    const rightPorts = Object.values(ports).filter(p => p.type === 'right').length;
    const numPorts = Math.max(leftPorts, rightPorts, 1);
    node.size = {
      ...(size || {}),
      height: numPorts * 30 + 12,
    };
  }
};

interface ChannelInfo {
  pending: boolean;
  uniqueId: string;
  pubkey: string;
  capacity: string;
  localBalance: string;
  remoteBalance: string;
}

const mapOpenChannel = (chan: Channel): ChannelInfo => ({
  pending: false,
  uniqueId: chan.channelPoint.slice(-12),
  pubkey: chan.remotePubkey,
  capacity: chan.capacity,
  localBalance: chan.localBalance,
  remoteBalance: chan.remoteBalance,
});

const mapPendingChannel = (chan: PendingChannel): ChannelInfo => ({
  pending: true,
  uniqueId: chan.channelPoint.slice(-12),
  pubkey: chan.remoteNodePub,
  capacity: chan.capacity,
  localBalance: chan.localBalance,
  remoteBalance: chan.remoteBalance,
});

const updateLinksAndPorts = (
  channel: ChannelInfo,
  pubkeys: Record<string, string>,
  nodes: { [x: string]: INode },
  fromNode: INode,
  links: { [x: string]: ILink },
) => {
  // use the channel point as a unique id since pending channels do not have a channel id yet
  const chanId = channel.uniqueId;
  const toName = pubkeys[channel.pubkey];
  const toNode = nodes[toName];
  const fromOnLeftSide = fromNode.position.x < toNode.position.x;

  // create or update the port on the from node
  fromNode.ports[chanId] = {
    ...(fromNode.ports[chanId] || {}),
    id: chanId,
    type: fromOnLeftSide ? 'right' : 'left',
  };

  // create or update the port on the to node
  toNode.ports[chanId] = {
    ...(toNode.ports[chanId] || {}),
    id: chanId,
    type: fromOnLeftSide ? 'left' : 'right',
  };

  // create or update the link
  links[chanId] = {
    ...(links[chanId] || {}),
    id: chanId,
    from: { nodeId: fromNode.id, portId: chanId },
    to: { nodeId: toName, portId: chanId },
    properties: {
      type: channel.pending ? 'pending-channel' : 'open-channel',
      capacity: channel.capacity,
      fromBalance: channel.localBalance,
      toBalance: channel.remoteBalance,
      direction: fromOnLeftSide ? 'ltr' : 'rtl',
    },
  };
};

export const updateChartFromNetwork = (
  chart: IChart,
  nodesData: LndNodeMapping,
): IChart => {
  // create a mapping of node name to pubkey for lookups
  const pubkeys: Record<string, string> = {};
  Object.entries(nodesData).forEach(([name, data]) => {
    if (!data.info || !data.info.identityPubkey) return;
    pubkeys[data.info.identityPubkey] = name;
  });

  const nodes = { ...chart.nodes };
  const links = { ...chart.links };
  const linkIds: string[] = [];

  // update the node and links for each node
  Object.entries(nodesData).forEach(([fromName, data]) => {
    // const { newNode, newLinks } = updateNode(fromName, nodes[fromName], data, pubkeys);
    const fromNode = nodes[fromName];

    if (data.channels) {
      const { open, opening, closing, forceClosing, waitingClose } = data.channels;

      // merge all of the channel types into one array
      const allChannels = [
        ...open.filter(c => c.initiator).map(mapOpenChannel),
        ...opening.map(c => c.channel as PendingChannel).map(mapPendingChannel),
        ...closing.map(c => c.channel as PendingChannel).map(mapPendingChannel),
        ...forceClosing.map(c => c.channel as PendingChannel).map(mapPendingChannel),
        ...waitingClose.map(c => c.channel as PendingChannel).map(mapPendingChannel),
      ];

      allChannels.forEach(channel => {
        updateLinksAndPorts(channel, pubkeys, nodes, fromNode, links);
        linkIds.push(channel.uniqueId);
      });

      nodes[fromName] = {
        ...fromNode,
      };
    }
  });

  // remove links for channels that that no longer exist
  Object.keys(links).forEach(linkId => {
    // don't remove links for existing channels
    if (linkIds.includes(linkId)) return;
    // don't remove links to bitcoin nodes
    if (linkId.endsWith('-backend')) return;
    // delete any other links
    delete links[linkId];
  });

  // resize chart nodes if necessary to fit new ports
  Object.keys(nodesData).forEach(name => updateNodeSize(nodes[name]));

  return {
    ...chart,
    nodes,
    links,
  };
};
