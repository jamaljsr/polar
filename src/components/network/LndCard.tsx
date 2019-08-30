import React from 'react';
import { Avatar, Card, Icon } from 'antd';
import { LightningNode, Status } from 'types';
import { DetailsList, Loader, StatusBadge } from 'components/common';
import lnd from 'resources/lnd.png';

interface Props {
  node: LightningNode;
  className?: string;
  details: { label: string; value: string }[];
}

const LndCard: React.FC<Props> = ({ node, className, details }) => {
  const loading = [Status.Starting, Status.Stopping].includes(node.status);
  const running = node.status === Status.Started;

  return (
    <Card
      title={<StatusBadge status={node.status} text={node.name} />}
      className={className}
      size="small"
      extra={loading ? <Loader inline /> : <Avatar src={lnd} shape="square" />}
      actions={
        !running
          ? undefined
          : [
              <Icon type="code" key="code" />,
              <Icon type="file-text" key="logs" />,
              <Icon type="ellipsis" key="ellipsis" />,
            ]
      }
    >
      {running ? <DetailsList details={details} /> : <span>Stopped</span>}
    </Card>
  );
};

export default LndCard;
