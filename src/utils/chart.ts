import { IChart } from '@mrblenny/react-flow-chart';
import { Network } from 'types';
import btclogo from 'resources/bitcoin.svg';
import lndlogo from 'resources/lnd.png';

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

  return chart;
};
