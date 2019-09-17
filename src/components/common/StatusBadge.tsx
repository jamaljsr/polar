import React from 'react';
import { Badge, Tooltip } from 'antd';
import { Status } from 'types';

export interface StatusBadgeProps {
  status: Status;
  text?: string;
}

interface BadgeStatus {
  [key: number]: 'success' | 'processing' | 'default' | 'error' | 'warning';
}

const badgeStatuses: BadgeStatus = {
  [Status.Starting]: 'processing',
  [Status.Started]: 'success',
  [Status.Stopping]: 'processing',
  [Status.Stopped]: 'default',
  [Status.Error]: 'error',
};

const StatusBadge: React.SFC<StatusBadgeProps> = ({ status, text }) => (
  <>
    <Tooltip overlay={Status[status]}>
      <Badge status={badgeStatuses[status]} />
    </Tooltip>
    {text}
  </>
);

export default StatusBadge;
