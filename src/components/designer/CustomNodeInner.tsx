import React from 'react';
import { INodeInnerDefaultProps } from '@mrblenny/react-flow-chart';
import { StatusBadge } from 'components/common';

const CustomNodeInner: React.FC<INodeInnerDefaultProps> = ({ node }) => {
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

export default CustomNodeInner;
