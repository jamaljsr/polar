import React from 'react';
import { Status } from 'types';
import { Badge } from 'antd';

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

const StatusBadge: React.SFC<StatusBadgeProps> = ({ status, text }) => {
  return (
    <>
      <Badge status={badgeStatuses[status]} />
      {text}
    </>
  );
};

export default StatusBadge;
