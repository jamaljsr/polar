import React, { useEffect } from 'react';
import styled from '@emotion/styled';
import { FlowChart } from '@mrblenny/react-flow-chart';
import { useDebounce } from 'hooks';
import { useStoreActions, useStoreState } from 'store';
import { Network } from 'types';
import { Loader } from 'components/common';
import { Link, NodeInner, Port, Ports } from './custom';
import { OpenChannelModal } from './lightning/actions';
import Sidebar from './Sidebar';

const Styled = {
  Designer: styled.div`
    position: relative;
    flex: 1;
  `,
  FlowChart: styled(FlowChart)`
    height: 100%;
  `,
};

interface Props {
  network: Network;
  updateStateDelay?: number;
}

const NetworkDesigner: React.FC<Props> = ({ network, updateStateDelay = 3000 }) => {
  const { setActiveId, ...callbacks } = useStoreActions(s => s.designer);
  const { allCharts, activeId } = useStoreState(s => s.designer);
  const { openChannel } = useStoreState(s => s.modals);
  // update the redux store with the current network's chart
  useEffect(() => {
    if (allCharts[network.id] && activeId !== network.id) setActiveId(network.id);
  }, [network.id, setActiveId, allCharts, activeId]);

  const { save } = useStoreActions(s => s.network);
  const chart = useStoreState(s => s.designer.activeChart);
  // prevent saving the new chart on every callback
  // which can be many, ex: onDragNode, onDragCanvas, etc
  const debouncedChart = useDebounce(chart, updateStateDelay);
  useEffect(() => {
    // save to disk when the chart is changed (debounced)
    if (debouncedChart) save();
  }, [debouncedChart, save]);

  if (!chart) return <Loader />;

  return (
    <Styled.Designer>
      <Styled.FlowChart
        chart={chart}
        config={{ snapToGrid: true }}
        Components={{
          NodeInner,
          Link,
          Port,
          Ports,
        }}
        callbacks={callbacks}
      />
      <Sidebar network={network} chart={chart} />
      {openChannel.visible && <OpenChannelModal network={network} />}
    </Styled.Designer>
  );
};

export default NetworkDesigner;
