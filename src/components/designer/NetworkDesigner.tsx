import React, { useEffect, useState } from 'react';
import { FlowChart } from '@mrblenny/react-flow-chart';
import useDebounce from 'hooks/useDebounce';
import { useStoreActions } from 'store';
import { Network } from 'types';
import { initChartFromNetwork } from 'utils/chart';
import * as chartCallbacks from './chartCallbacks';
import CustomNodeInner from './CustomNodeInner';

interface Props {
  network: Network;
}

const NetworkDesigner: React.FC<Props> = ({ network }) => {
  const initialChart = network.design || initChartFromNetwork(network);
  const [chart, setChart] = useState(initialChart);
  const { setNetworkDesign, save } = useStoreActions(s => s.network);

  // update chart in state when the network status changes
  useEffect(() => {
    setChart(c => {
      Object.keys(c.nodes).forEach(n => {
        c.nodes[n].properties.status = network.status;
      });
      return { ...c };
    });
  }, [network.status]);

  // prevent updating redux state with the new chart on every callback
  // which can be many, ex: onDragNode, onLinkMouseEnter
  const debouncedChart = useDebounce(chart, 3000);
  useEffect(() => {
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
    (allActions: { [key: string]: any }, [key, action]: [string, any]) => {
      allActions[key] = (...args: any) => {
        // call the action with the args from FlowChart and the current chart object
        const newChart = action(...args)(chart);
        // need to pass a new object to the hook to trigger a rerender
        setChart({ ...newChart });
      };
      return allActions;
    },
    {},
  ) as typeof chartCallbacks;

  return !chart ? null : (
    <div>
      <FlowChart
        chart={chart}
        config={{ snapToGrid: true }}
        Components={{ NodeInner: CustomNodeInner }}
        callbacks={callbacks}
      />
    </div>
  );
};

export default NetworkDesigner;
