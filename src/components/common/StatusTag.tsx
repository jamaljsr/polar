import React from 'react';
import { useTranslation } from 'react-i18next';
import { Row, Tag } from 'antd';
import { useTheme } from 'hooks/useTheme';
import { Status } from 'shared/types';
import { useStoreState } from 'store';

export interface StatusTagProps {
  networkId: number;
}

const StatusTag: React.FC<StatusTagProps> = ({ networkId }) => {
  const { t } = useTranslation();

  const { networks } = useStoreState(s => s.network);
  const network = networks.find(n => n.id === networkId);

  const { statusTag } = useTheme();

  const statusColors = {
    [Status.Starting]: 'blue',
    [Status.Started]: 'green',
    [Status.Stopping]: 'blue',
    [Status.Stopped]: statusTag.stopped,
    [Status.Error]: 'red',
  };

  return (
    <Row>
      {network && (
        <Tag color={statusColors[network.status]}>
          {t(`enums.status.${Status[network.status]}`)}
        </Tag>
      )}
      {network?.externalNetworkName && (
        <Tag color="blue">{`External: ${network.externalNetworkName}`}</Tag>
      )}
    </Row>
  );
};

export default StatusTag;
