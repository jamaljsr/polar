import React, { useMemo } from 'react';
import { useAsyncCallback } from 'react-async-hook';
import { IChart } from '@mrblenny/react-flow-chart';
import { Button, Tooltip } from 'antd';
import { useStoreActions } from 'store';
import { Network, Status } from 'types';
import BitcoindDetails from './bitcoind/BitcoindDetails';
import LndDetails from './lnd/LndDetails';
import SidebarCard from './SidebarCard';

interface Props {
  network: Network;
  chart: IChart;
}

const Sidebar: React.FC<Props> = ({ network, chart }) => {
  const { notify } = useStoreActions(s => s.app);
  const { syncChart, redrawChart } = useStoreActions(s => s.designer);
  const syncChartAsync = useAsyncCallback(async () => {
    try {
      await syncChart(network);
      redrawChart();
      notify({ message: 'The network design has been synced with the Lightning nodes' });
    } catch (error) {
      notify({ message: 'Failed to sync the network', error });
    }
  });

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
      <SidebarCard
        title="Network Designer"
        extra={
          <Tooltip title="Update channels from nodes">
            <Button
              icon="reload"
              disabled={network.status !== Status.Started}
              onClick={syncChartAsync.execute}
              loading={syncChartAsync.loading}
            />
          </Tooltip>
        }
      >
        Click on an element in the designer to see details
      </SidebarCard>
    );
  }, [network, chart.selected, syncChartAsync]);

  return <>{cmp}</>;
};

export default Sidebar;
