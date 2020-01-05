import React from 'react';
import { useTranslation } from 'react-i18next';
import { Tag } from 'antd';
import { Status } from 'shared/types';

export interface StatusTagProps {
  status: Status;
}

const statusColors = {
  [Status.Starting]: 'blue',
  [Status.Started]: 'green',
  [Status.Stopping]: 'blue',
  [Status.Stopped]: 'rgba(255, 255, 255, 0.25)',
  [Status.Error]: 'red',
};

const StatusTag: React.FC<StatusTagProps> = ({ status }) => {
  const { t } = useTranslation();

  return <Tag color={statusColors[status]}>{t(`enums.status.${Status[status]}`)}</Tag>;
};

export default StatusTag;
