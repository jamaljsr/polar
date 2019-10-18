import React from 'react';
import { Button, Dropdown, Icon, Menu } from 'antd';
import { ButtonType } from 'antd/lib/button';
import { usePrefixedTranslation } from 'hooks';
import { Status } from 'types';

interface Props {
  status: Status;
  onClick: () => void;
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

const NetworkActions: React.FC<Props> = ({ status, onClick }) => {
  const { l } = usePrefixedTranslation('cmps.network.NetworkActions');
  const loading = status === Status.Starting || status === Status.Stopping;
  const { label, type, icon } = config[status];

  const menu = (
    <Menu theme="dark">
      <Menu.Item key="1">
        <Icon type="form" />
        {l('menuRename')}
      </Menu.Item>
      <Menu.Item key="2">
        <Icon type="close" />
        {l('menuDelete')}
      </Menu.Item>
    </Menu>
  );

  return (
    <>
      <Button key="start" type={type} icon={icon} loading={loading} onClick={onClick}>
        {l(`primaryBtn${label}`)}
      </Button>
      <Dropdown key="options" overlay={menu}>
        <Button icon="more" />
      </Dropdown>
    </>
  );
};

export default NetworkActions;
