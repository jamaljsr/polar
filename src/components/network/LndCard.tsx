import React from 'react';
import { LightningNode } from 'types';
import { Card, Avatar, Icon } from 'antd';
import { StatusBadge, DetailsList } from 'components/common';
import lnd from 'resources/lnd.png';

interface Props {
  node: LightningNode;
  className?: string;
  details: { label: string; value: string }[];
}

const LndCard: React.FC<Props> = ({ node, details, className }) => (
  <Card
    title={<StatusBadge status={node.status} text={node.name} />}
    className={className}
    size="small"
    extra={<Avatar src={lnd} shape="square" />}
    actions={[
      <Icon type="code" key="code" />,
      <Icon type="file-text" key="logs" />,
      <Icon type="ellipsis" key="ellipsis" />,
    ]}
  >
    <DetailsList details={details} />
  </Card>
);

export default LndCard;
