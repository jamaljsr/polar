import React from 'react';
import { useTranslation } from 'react-i18next';
import styled from '@emotion/styled';
import { Badge, Tooltip } from 'antd';
import { Status } from 'shared/types';

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

const Styled = {
  Text: styled.span`
    display: inline-block;
    margin-left: 8px;
  `,
};

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, text }) => {
  const { t } = useTranslation();
  return (
    <>
      <Tooltip overlay={t(`enums.status.${Status[status]}`)}>
        <Badge status={badgeStatuses[status]} />
      </Tooltip>
      <Styled.Text>{text}</Styled.Text>
    </>
  );
};

export default StatusBadge;
