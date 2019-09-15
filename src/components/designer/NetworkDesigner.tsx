import React, { useEffect, useState } from 'react';
import { FlowChart } from '@mrblenny/react-flow-chart';
import * as chartCallbacks from '@mrblenny/react-flow-chart/src/container/actions';
import useDebounce from 'hooks/useDebounce';
import { useStoreActions } from 'store';
import { Network } from 'types';
import { initChartFromNetwork } from 'utils/chart';
// import * as chartCallbacks from './chartCallbacks';
import CustomNodeInner from './CustomNodeInner';

interface Props {
  network: Network;
  updateStateDelay?: number;
}

const NetworkDesigner: React.FC<Props> = ({ network, updateStateDelay = 3000 }) => {
  const [chart, setChart] = useState(
    // use function to avoid calling init on every rerender
    () => network.design || initChartFromNetwork(network),
  );
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
  const debouncedChart = useDebounce(chart, updateStateDelay);
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
    <FlowChart
      chart={chart}
      config={{ snapToGrid: true }}
      Components={{ NodeInner: CustomNodeInner }}
      callbacks={callbacks}
    />
  );
};

export default NetworkDesigner;
