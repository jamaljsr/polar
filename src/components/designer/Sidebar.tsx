import React, { useMemo } from 'react';
import { IChart } from '@mrblenny/react-flow-chart';
import { CLightningNode, LndNode } from 'shared/types';
import { Network } from 'types';
import BitcoindDetails from './bitcoind/BitcoindDetails';
import CLightningDetails from './clightning/CLightningDetails';
import DefaultSidebar from './default/DefaultSidebar';
import LinkDetails from './link/LinkDetails';
import LndDetails from './lnd/LndDetails';

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
      } else if (node && node.implementation === 'c-lightning') {
        return <CLightningDetails node={node as CLightningNode} />;
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
