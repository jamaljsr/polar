import React from 'react';
import { useAsyncCallback } from 'react-async-hook';
import styled from '@emotion/styled';
import { Button, Tooltip } from 'antd';
import { useStoreActions } from 'store';
import { LndVersion, Network, Status } from 'types';
import lndLogo from 'resources/lnd.png';
import SidebarCard from '../SidebarCard';
import DraggableNode from './DraggableNode';

const Styled = {
  AddNodes: styled.h3`
    margin-top: 30px;
  `,
  AddDesc: styled.p`
    opacity: 0.5;
    font-size: 12px;
  `,
};

interface Props {
  network: Network;
}

const DefaultSidebar: React.FC<Props> = ({ network }) => {
  const { notify } = useStoreActions(s => s.app);
  const { syncChart, redrawChart } = useStoreActions(s => s.designer);
  const syncChartAsync = useAsyncCallback(async () => {
    try {
      await syncChart(network);
      redrawChart();
      notify({ message: 'The designer has been synced with the Lightning nodes' });
    } catch (error) {
      notify({ message: 'Failed to sync the network', error });
    }
  });

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
      <p>Click on an element in the designer to see details</p>
      <Styled.AddNodes>Add Nodes</Styled.AddNodes>
      <Styled.AddDesc>
        Drag a node below onto the canvas to add it to the network
      </Styled.AddDesc>
      {Object.keys(LndVersion)
        .filter(v => v !== 'latest')
        .map(version => (
          <DraggableNode
            key={version}
            label={`LND v${version}`}
            icon={lndLogo}
            properties={{ type: 'lnd', version }}
          />
        ))}
    </SidebarCard>
  );
};

export default DefaultSidebar;
