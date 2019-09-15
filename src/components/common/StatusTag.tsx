import React from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();

  return (
    <Tag color={statusColors[status]}>
      {t(`cmps.status-tag.status-${Status[status].toLowerCase()}`)}
    </Tag>
  );
};

export default StatusTag;
