import React, { ReactElement, ReactNode, useMemo } from 'react';
import styled from '@emotion/styled';
import { IChart } from '@mrblenny/react-flow-chart';
import { Card } from 'antd';
import { useStoreState } from 'store';
import { Network } from 'types';
import { format, toSats } from 'utils/units';
import BitcoindDetails from './bitcoind/BitcoindDetails';
import LndDetails from './lnd/LndDetails';

const Styled = {
  Card: styled(Card)`
    position: absolute;
    top: 16px;
    bottom: 16px;
    right: 16px;
    width: 350px;
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
  const { walletInfo } = useStoreState(s => s.bitcoind);
  const { nodes } = useStoreState(s => s.lnd);
  const [title, cmp, extra] = useMemo(() => {
    const { id, type } = chart.selected;
    let cmp: ReactElement | undefined;
    let title: string | undefined;
    let extra: ReactNode | undefined;

    if (type === 'node') {
      const { bitcoin, lightning } = network.nodes;
      const node = bitcoin.find(n => n.name === id) || lightning.find(n => n.name === id);
      if (node && node.implementation === 'bitcoind') {
        title = node.name;
        cmp = <BitcoindDetails node={node} />;
        if (walletInfo) {
          extra = <strong>{format(toSats(walletInfo.balance))} sats</strong>;
        }
      } else if (node && node.implementation === 'LND') {
        title = node.name;
        cmp = <LndDetails node={node} onOpenChannel={onOpenChannel} />;
        const lnd = nodes[node.name];
        if (lnd && lnd.walletBalance !== undefined) {
          extra = <strong>{format(lnd.walletBalance.confirmedBalance)} sats</strong>;
        }
      }
    }

    if (!cmp) {
      title = 'Network Designer';
      cmp = <div>Click on an element in the designer to see details</div>;
      extra = undefined;
    }

    return [title, cmp, extra];
  }, [network, chart.selected, onOpenChannel, walletInfo, nodes]);

  return (
    <Styled.Card title={title} extra={extra}>
      {cmp}
    </Styled.Card>
  );
};

export default Sidebar;
