import React, { useEffect } from 'react';
import { FlowChart, INodeInnerDefaultProps } from '@mrblenny/react-flow-chart';
import { useStoreActions, useStoreState } from 'store';
import { Network } from 'types';
import { StatusBadge } from 'components/common';

interface Props {
  network: Network;
}

const NodeInnerCustom = ({ node }: INodeInnerDefaultProps) => {
  return (
    <div
      style={{
        padding: '20px',
        textAlign: 'center',
        fontWeight: 'bold',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <span>
        <StatusBadge text={node.id} status={node.properties.status} />
      </span>
      <img src={node.properties.icon} style={{ width: 24, height: 24 }} alt="" />
    </div>
  );
};

const NetworkDesigner: React.FC<Props> = ({ network }) => {
  const { chart } = useStoreState(s => s.designer);
  const { initialize, setChart, ...callbacks } = useStoreActions(s => s.designer);
  useEffect(() => {
    if (network.design) {
      setChart(network.design);
    } else {
      initialize(network);
    }
  }, [network]);

  return (
    <div>
      <FlowChart
        chart={chart}
        config={{ snapToGrid: true }}
        Components={{ NodeInner: NodeInnerCustom }}
        callbacks={callbacks}
      />
    </div>
  );
};

export default NetworkDesigner;
