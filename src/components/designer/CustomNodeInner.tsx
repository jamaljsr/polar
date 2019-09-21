import React from 'react';
import styled from '@emotion/styled';
import { INodeInnerDefaultProps } from '@mrblenny/react-flow-chart';
import { StatusBadge } from 'components/common';

const Node = styled.div`
  padding: 20px;
  text-align: center;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const CustomNodeInner: React.FC<INodeInnerDefaultProps> = ({ node }) => {
  return (
    <Node>
      <span>
        <StatusBadge text={node.id} status={node.properties.status} />
      </span>
      <img src={node.properties.icon} style={{ width: 24, height: 24 }} alt="" />
    </Node>
  );
};

export default CustomNodeInner;
