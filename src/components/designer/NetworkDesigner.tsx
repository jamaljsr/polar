import React, { useEffect, useState } from 'react';
import styled from '@emotion/styled';
import { FlowChart } from '@mrblenny/react-flow-chart';
import * as chartCallbacks from '@mrblenny/react-flow-chart/src/container/actions';
import useDebounce from 'hooks/useDebounce';
import { useStoreActions } from 'store';
import { Network, Status } from 'types';
import { initChartFromNetwork } from 'utils/chart';
import CustomNodeInner from './CustomNodeInner';
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
  const [chart, setChart] = useState(
    // use function to avoid calling init on every rerender
    () => network.design || initChartFromNetwork(network),
  );
  // keep array of each node's status in state in order to detect changes
  const [nodeStates, setNodeStates] = useState();
  const statuses = [network.status]
    .concat(
      network.nodes.bitcoin.map(n => n.status),
      network.nodes.lightning.map(n => n.status),
    )
    .toString();
  // if any node status changed then update the local state
  if (statuses !== nodeStates) {
    setNodeStates(statuses);
  }

  // update chart in state when the network status changes
  const { lightning, bitcoin } = network.nodes;
  useEffect(() => {
    setChart(c => {
      Object.keys(c.nodes).forEach(n => {
        // create a mapping of node name to its status
        const nodes: Record<string, Status> = [...lightning, ...bitcoin].reduce(
          (result, node) => ({
            ...result,
            [node.name]: node.status,
          }),
          {},
        );
        // update the node status in the chart
        c.nodes[n].properties.status = nodes[n];
      });
      return { ...c };
    });
  }, [network.status, nodeStates, lightning, bitcoin]);

  const { setNetworkDesign, save } = useStoreActions(s => s.network);
  // prevent updating redux state with the new chart on every callback
  // which can be many, ex: onDragNode, onLinkMouseEnter
  const debouncedChart = useDebounce(chart, updateStateDelay);
  useEffect(() => {
    // TODO: save changes here instead of on unmount
    // store the updated chart in the redux store
    setNetworkDesign({ id: network.id, chart: debouncedChart });
    // eslint-disable-next-line
  }, [debouncedChart]); // missing deps are intentional

  // save network with chart to disk if this component is unmounted
  useEffect(() => {
    const saveAsync = async () => await save();
    return () => {
      setNetworkDesign({ id: network.id, chart });
      saveAsync();
    };
    // eslint-disable-next-line
  }, []); // this effect should only fun the cleanup func once when unmounted

  // use custom callbacks to update the chart based on user interactions.
  // this wacky code intercepts the callbacks, giving them the current chart
  // from component state then storing the returned chart back in state
  const callbacks = Object.entries(chartCallbacks).reduce(
    (allActions: Record<string, any>, entry: [string, any]) => {
      // key is the property name of the chartCallbacks object
      // func is the callback function
      const [key, func] = entry;
      allActions[key] = (...args: any) => {
        // invoke the curried function with the args from the FlowChart
        // component and the current chart object from state
        const newChart = func(...args)(chart);
        // need to pass a new object to the hook to trigger a rerender
        setChart({ ...newChart });
      };
      return allActions;
    },
    {},
  ) as typeof chartCallbacks;

  return (
    <Styled.Designer>
      <Styled.FlowChart
        chart={chart}
        config={{ snapToGrid: true }}
        Components={{ NodeInner: CustomNodeInner }}
        callbacks={callbacks}
      />
      <Sidebar network={network} chart={chart} />
    </Styled.Designer>
  );
};

export default NetworkDesigner;
