import React, { ReactElement, useMemo } from 'react';
import { IChart } from '@mrblenny/react-flow-chart';
import { Drawer } from 'antd';
import { Network } from 'types';
import BitcoindDetails from './bitcoind/BitcoindDetails';
import LndDetails from './lnd/LndDetails';

interface Props {
  network: Network;
  chart: IChart;
  onClose: () => void;
}

const Sidebar: React.FC<Props> = ({ network, chart, onClose }) => {
  const [title, cmp] = useMemo(() => {
    const { id, type } = chart.selected;
    let cmp: ReactElement | undefined;
    let title: string | undefined;

    if (type === 'node') {
      const { bitcoin, lightning } = network.nodes;
      const node = bitcoin.find(n => n.name === id) || lightning.find(n => n.name === id);
      if (node && node.implementation === 'bitcoind') {
        title = node.name;
        cmp = <BitcoindDetails node={node} />;
      } else if (node && node.implementation === 'LND') {
        title = node.name;
        cmp = <LndDetails node={node} />;
      }
    }

    return [title, cmp];
  }, [network, chart.selected]);

  return (
    <Drawer visible={!!cmp} onClose={onClose} width={400} title={title}>
      {cmp}
    </Drawer>
  );
};

export default Sidebar;
