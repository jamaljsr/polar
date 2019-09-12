import React from 'react';
import {
  FlowChartWithState,
  IChart,
  INodeInnerDefaultProps,
} from '@mrblenny/react-flow-chart';
import { Network } from 'types';
import { StatusBadge } from 'components/common';
import btclogo from 'resources/bitcoin.svg';
import lndlogo from 'resources/lnd.png';

interface Props {
  network: Network;
}

const NodeInnerCustom = ({ node, config }: INodeInnerDefaultProps) => {
  return (
    <div
      style={{
        padding: '20px',
        textAlign: 'center',
        fontWeight: 'bold',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <span>
        <StatusBadge text={node.id} status={node.properties.status} />
      </span>
      <img src={node.properties.icon} style={{ width: 24, height: 24 }} alt="" />
    </div>
  );
};

const NetworkDesigner: React.FC<Props> = ({ network }) => {
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
      position: { x: 100, y: 200 },
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
      position: { x: 100, y: 200 },
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
    chart.links[linkName] = {
      id: linkName,
      from: { nodeId: n.name, portId: 'backend' },
      to: { nodeId: n.backendName, portId: 'backend' },
    };
  });

  return (
    <div>
      <FlowChartWithState
        initialValue={chart}
        config={{ snapToGrid: true }}
        Components={{ NodeInner: NodeInnerCustom }}
      />
    </div>
  );
};

export default NetworkDesigner;
