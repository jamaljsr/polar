import React, { ReactNode } from 'react';
import styled from '@emotion/styled';
import { Button } from 'antd';
import { Status } from 'shared/types';
import { ButtonType } from 'antd/lib/button';
import { PlayCircleOutlined, StopOutlined, WarningOutlined } from '@ant-design/icons';

const Styled = {
  Button: styled(Button, {
    shouldForwardProp: prop => prop !== 'fullWidth',
  })<{ fullWidth?: boolean }>`
    margin-left: 0;
    ${({ fullWidth }) => fullWidth && 'width: 100%;'}
  `,
};

interface StatusButtonProps {
  status: Status;
  onClick: () => void;
  fullWidth?: boolean;
}

const config: {
  [key: number]: {
    label: string;
    type: ButtonType;
    danger?: boolean;
    icon: ReactNode;
  };
} = {
  [Status.Starting]: {
    label: 'Starting',
    type: 'primary',
    icon: '',
  },
  [Status.Started]: {
    label: 'Stop',
    type: 'primary',
    danger: true,
    icon: <StopOutlined />,
  },
  [Status.Stopping]: {
    label: 'Stopping',
    type: 'default',
    icon: '',
  },
  [Status.Stopped]: {
    label: 'Start',
    type: 'primary',
    icon: <PlayCircleOutlined />,
  },
  [Status.Error]: {
    label: 'Restart',
    type: 'primary',
    danger: true,
    icon: <WarningOutlined />,
  },
};

const StatusButton: React.FC<StatusButtonProps> = ({ status, onClick, fullWidth }) => {
  const { type, danger, icon, label } = config[status];
  const ghost = status === Status.Started;
  const loading = status === Status.Starting || status === Status.Stopping;
  return (
    <Styled.Button
      key={label}
      type={type}
      danger={danger}
      icon={icon}
      loading={loading}
      ghost={ghost}
      onClick={onClick}
      fullWidth={fullWidth}
    >
      {label}
    </Styled.Button>
  );
};

export default StatusButton;
