import React, { ReactElement, useMemo } from 'react';
import { IChart } from '@mrblenny/react-flow-chart';
import { Drawer } from 'antd';
import { BitcoinNode, LightningNode, Network } from 'types';
import BitcoindDetails from './bitcoind/BitcoindDetails';

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
  const [title, cmp] = useMemo(() => {
    const { id, type } = chart.selected || {};
    let cmp: ReactElement | undefined;
    let title: string | undefined;

    if (type === 'node') {
      const node = findNode(network, id);
      if (node && node.implementation === 'bitcoind') {
        title = node.name;
        cmp = <BitcoindDetails node={node} />;
      }
    }

    return [title, cmp];
  }, [network, chart.selected]);

  return (
    <Drawer visible={!!cmp} onClose={onClose} width={300} title={title}>
      {cmp}
    </Drawer>
  );
};

export default Sidebar;
