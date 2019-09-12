import React from 'react';
import {
  FlowChartWithState,
  IChart,
  INodeInnerDefaultProps,
} from '@mrblenny/react-flow-chart';
import { Network } from 'types';

interface Props {
  network: Network;
}

const NodeInnerCustom = ({ node, config }: INodeInnerDefaultProps) => {
  return (
    <div style={{ padding: '20px 10px', textAlign: 'center', fontWeight: 'bold' }}>
      {node.id}
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
    };
  });

  network.nodes.lightning.forEach(n => {
    chart.nodes[n.name] = {
      id: n.name,
      type: 'input-output',
      position: { x: 100, y: 200 },
      ports: {
        port1: { id: 'port1', type: 'input' },
        backend: { id: 'backend', type: 'output' },
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
