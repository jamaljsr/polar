import React, { useMemo } from 'react';
import { IChart } from '@mrblenny/react-flow-chart';
import { Network } from 'types';
import BitcoindDetails from './bitcoind/BitcoindDetails';
import LndDetails from './lnd/LndDetails';
import SidebarCard from './SidebarCard';

interface Props {
  network: Network;
  chart: IChart;
}

const Sidebar: React.FC<Props> = ({ network, chart }) => {
  const cmp = useMemo(() => {
    const { id, type } = chart.selected;

    if (type === 'node') {
      const { bitcoin, lightning } = network.nodes;
      const node = bitcoin.find(n => n.name === id) || lightning.find(n => n.name === id);
      if (node && node.implementation === 'bitcoind') {
        return <BitcoindDetails node={node} />;
      } else if (node && node.implementation === 'LND') {
        return <LndDetails node={node} />;
      }
    }

    return (
      <SidebarCard title="Network Designer">
        Click on an element in the designer to see details
      </SidebarCard>
    );
  }, [network, chart.selected]);

  return <>{cmp}</>;
};

export default Sidebar;
