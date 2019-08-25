import React from 'react';
import { LightningNode } from 'types';
import { Card, Avatar, Icon } from 'antd';
import { StatusBadge, DetailsList } from 'components/common';
import lnd from 'resources/lnd.png';

interface Props {
  node: LightningNode;
  className?: string;
}

const lndDetails = [
  { label: 'PubKey', value: '0245....5fd47' },
  { label: 'Host', value: '159.65.239.204:9735' },
  { label: 'Channels', value: '2' },
  { label: 'Synced to Chain', value: 'true' },
  { label: 'Chain Node', value: 'bitcoind1' },
  { label: 'Version', value: 'v0.7.1' },
];

const LndCard: React.FC<Props> = ({ node, className }) => {
  return (
    <Card
      title={<StatusBadge status={node.status} text={node.name} />}
      className={className}
      extra={<Avatar src={lnd} shape="square" size="small" />}
      actions={[
        <Icon type="code" key="code" />,
        <Icon type="file-text" key="logs" />,
        <Icon type="ellipsis" key="ellipsis" />,
      ]}
    >
      <DetailsList details={lndDetails} />
    </Card>
  );
};

export default LndCard;
