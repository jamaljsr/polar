import React, { ReactElement, useMemo } from 'react';
import styled from '@emotion/styled';
import { IChart } from '@mrblenny/react-flow-chart';
import { Card } from 'antd';
import { Network } from 'types';
import BitcoindDetails from './bitcoind/BitcoindDetails';
import LndDetails from './lnd/LndDetails';

const Styled = {
  Card: styled(Card)`
    position: absolute;
    top: 16px;
    bottom: 16px;
    right: 16px;
    width: 300px;
    background-color: #fff;
    border-radius: 4px;
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
  `,
};

interface Props {
  network: Network;
  chart: IChart;
  onOpenChannel: (args: { to?: string; from?: string }) => void;
}

const Sidebar: React.FC<Props> = ({ network, chart, onOpenChannel }) => {
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
        cmp = <LndDetails node={node} onOpenChannel={onOpenChannel} />;
      }
    }

    if (!cmp) {
      title = 'Network Designer';
      cmp = <div>Click on an element in the designer to see details</div>;
    }

    return [title, cmp];
  }, [network, chart.selected, onOpenChannel]);

  return <Styled.Card title={title}>{cmp}</Styled.Card>;
};

export default Sidebar;
