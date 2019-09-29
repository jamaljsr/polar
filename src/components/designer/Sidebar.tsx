import React, { ReactElement, useMemo } from 'react';
import styled from '@emotion/styled';
import { IChart } from '@mrblenny/react-flow-chart';
import { Card } from 'antd';
import { Network } from 'types';
import BitcoindDetails from './bitcoind/BitcoindDetails';
import LndDetails from './lnd/LndDetails';

const Styled = {
  Sidebar: styled(Card)`
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
}

const Sidebar: React.FC<Props> = ({ network, chart }) => {
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

    if (!cmp) {
      title = 'Network Designer';
      cmp = <div>Click on an element in the designer to see details</div>;
    }

    return [title, cmp];
  }, [network, chart.selected]);

  return <Styled.Sidebar title={title}>{cmp}</Styled.Sidebar>;
};

export default Sidebar;
