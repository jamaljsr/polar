import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Dropdown, Icon, Menu } from 'antd';
import { ButtonType } from 'antd/lib/button';
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
  const { t } = useTranslation();
  const loading = status === Status.Starting || status === Status.Stopping;
  const { label, type, icon } = config[status];

  const menu = (
    <Menu theme="dark">
      <Menu.Item key="1">
        <Icon type="form" />
        {t('cmps.network-actions.menu-edit', 'Edit')}
      </Menu.Item>
      <Menu.Item key="2">
        <Icon type="close" />
        {t('cmps.network-actions.menu-delete', 'Delete')}
      </Menu.Item>
    </Menu>
  );

  return (
    <>
      <Button key="start" type={type} icon={icon} loading={loading} onClick={onClick}>
        {t(`cmps.network-actions.primary-btn-${label.toLocaleLowerCase()}`, label)}
      </Button>
      <Dropdown key="options" overlay={menu}>
        <Button icon="down" />
      </Dropdown>
    </>
  );
};

export default NetworkActions;
