import React from 'react';
import { BitcoinNode } from 'types';
import { Card, Avatar, Icon } from 'antd';
import { StatusBadge, DetailsList } from 'components/common';
import logo from 'resources/bitcoin.svg';

interface Props {
  node: BitcoinNode;
  className?: string;
}

const btcDetails = [
  { label: 'Block Height', value: '432' },
  { label: 'Wallet Balance', value: '54.00000000' },
  { label: 'Host', value: '159.65.239.204:8443' },
  { label: 'Version', value: 'v0.18.1' },
];

const BitcoindCard: React.FC<Props> = ({ node, className }) => {
  return (
    <Card
      title={<StatusBadge status={node.status} text={node.name} />}
      className={className}
      extra={<Avatar src={logo} shape="square" />}
      actions={[
        <Icon type="code" key="code" />,
        <Icon type="file-text" key="logs" />,
        <Icon type="ellipsis" key="ellipsis" />,
      ]}
    >
      <DetailsList details={btcDetails} />
    </Card>
  );
};

export default BitcoindCard;
