import React, { useMemo } from 'react';
import { IChart } from '@mrblenny/react-flow-chart';
import { Drawer } from 'antd';
import { BitcoinNode, LightningNode, Network } from 'types';
import BitcoindDetails from './BitcoindDetails';

interface Props {
  network: Network;
  chart: IChart;
  onClose: () => void;
}

const findNode = (
  network: Network,
  id?: string,
): BitcoinNode | LightningNode | undefined => {
  const { bitcoin, lightning } = network.nodes;
  return bitcoin.find(n => n.name === id) || lightning.find(n => n.name === id);
};

const Sidebar: React.FC<Props> = ({ network, chart, onClose }) => {
  const cmp = useMemo(() => {
    const { id, type } = chart.selected || {};

    if (type === 'node') {
      const node = findNode(network, id);
      if (node && node.implementation === 'bitcoind') {
        return <BitcoindDetails node={node} />;
      }
    }

    return null;
  }, [network, chart.selected]);

  return (
    <Drawer visible={!!cmp} onClose={onClose} width={300}>
      {cmp}
    </Drawer>
  );
};

export default Sidebar;
