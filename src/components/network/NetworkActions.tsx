import React from 'react';
import { Status } from 'types';
import { Menu, Icon, Button, Dropdown } from 'antd';
import { ButtonType } from 'antd/lib/button';

interface Props {
  status: Status;
}

const config: {
  [key: number]: {
    label: string;
    type: ButtonType;
    icon: string;
  };
} = {
  [Status.Starting]: {
    label: 'Starting',
    type: 'primary',
    icon: '',
  },
  [Status.Started]: {
    label: 'Stop',
    type: 'default',
    icon: 'stop',
  },
  [Status.Stopping]: {
    label: 'Stopping',
    type: 'default',
    icon: '',
  },
  [Status.Stopped]: {
    label: 'Start',
    type: 'primary',
    icon: 'play-circle',
  },
  [Status.Error]: {
    label: 'Restart',
    type: 'danger',
    icon: 'warning',
  },
};

const NetworkActions: React.FC<Props> = ({ status }) => {
  const loading = status === Status.Starting || status === Status.Stopping;
  const { label, type, icon } = config[status];
  const menu = (
    <Menu theme="dark">
      <Menu.Item key="1">
        <Icon type="form" />
        Edit
      </Menu.Item>
      <Menu.Item key="2">
        <Icon type="close" />
        Delete
      </Menu.Item>
    </Menu>
  );

  return (
    <>
      <Button key="start" type={type} icon={icon} loading={loading}>
        {label}
      </Button>
      <Dropdown key="options" overlay={menu}>
        <Button icon="down" />
      </Dropdown>
    </>
  );
};

export default NetworkActions;
