import React, { useMemo } from 'react';
import { IChart } from '@mrblenny/react-flow-chart';
import { Network } from 'types';
import BitcoindDetails from './bitcoind/BitcoindDetails';
import DefaultSidebar from './default/DefaultSidebar';
import LinkDetails from './link/LinkDetails';
import LndDetails from './lnd/LndDetails';
import { LndNode } from 'shared/types';

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
        return <LndDetails node={node as LndNode} />;
      }
    } else if (type === 'link' && id) {
      const link = chart.links[id];
      return <LinkDetails link={link} network={network} />;
    }

    return <DefaultSidebar network={network} />;
  }, [network, chart.selected, chart.links]);

  return <>{cmp}</>;
};

export default Sidebar;
