import React from 'react';
import { Tag } from 'antd';
import { Status } from 'types';

export interface StatusTagProps {
  status: Status;
}

const statusColors = {
  [Status.Starting]: 'blue',
  [Status.Started]: 'green',
  [Status.Stopping]: 'blue',
  [Status.Stopped]: 'gray',
  [Status.Error]: 'red',
};

const StatusTag: React.FC<StatusTagProps> = ({ status }) => {
  return <Tag color={statusColors[status]}>{Status[status]}</Tag>;
};

export default StatusTag;
