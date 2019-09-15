import React from 'react';
import { INodeInnerDefaultProps } from '@mrblenny/react-flow-chart';
import { StatusBadge } from 'components/common';
import styles from './CustomNodeInner.module.less';

const CustomNodeInner: React.FC<INodeInnerDefaultProps> = ({ node }) => {
  return (
    <div className={styles.node}>
      <span>
        <StatusBadge text={node.id} status={node.properties.status} />
      </span>
      <img src={node.properties.icon} style={{ width: 24, height: 24 }} alt="" />
    </div>
  );
};

export default CustomNodeInner;
