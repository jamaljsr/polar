import React from 'react';
import { BitcoinNode } from 'types';
import { Card, Avatar, Icon } from 'antd';
import { StatusBadge, DetailsList } from 'components/common';
import logo from 'resources/bitcoin.svg';

interface Props {
  node: BitcoinNode;
  className?: string;
  details: { label: string; value: string }[];
}

const BitcoindCard: React.FC<Props> = ({ node, className, details }) => (
  <Card
    title={<StatusBadge status={node.status} text={node.name} />}
    className={className}
    size="small"
    extra={<Avatar src={logo} shape="square" />}
    actions={[
      <Icon type="code" key="code" />,
      <Icon type="file-text" key="logs" />,
      <Icon type="ellipsis" key="ellipsis" />,
    ]}
  >
    <DetailsList details={details} />
  </Card>
);

export default BitcoindCard;
