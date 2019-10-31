import React from 'react';
import { useAsyncCallback } from 'react-async-hook';
import styled from '@emotion/styled';
import { Button, Divider, Dropdown, Icon, Menu, Tag } from 'antd';
import { ButtonType } from 'antd/lib/button';
import { usePrefixedTranslation } from 'hooks';
import { Status } from 'shared/types';
import { useStoreActions, useStoreState } from 'store';
import { Network } from 'types';

const Styled = {
  Button: styled(Button)`
    margin-left: 0;
  `,
  MenuIcon: styled(Icon)`
    margin-right: 5px;
  `,
};

interface Props {
  network: Network;
  onClick: () => void;
  onRenameClick: () => void;
  onDeleteClick: () => void;
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
    type: 'danger',
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

const NetworkActions: React.FC<Props> = ({
  network,
  onClick,
  onRenameClick,
  onDeleteClick,
}) => {
  const { l } = usePrefixedTranslation('cmps.network.NetworkActions');

  const { status, nodes } = network;
  const bitcoinNode = nodes.bitcoin[0];
  const loading = status === Status.Starting || status === Status.Stopping;
  const started = status === Status.Started;
  const { label, type, icon } = config[status];

  const { chainInfo } = useStoreState(s => s.bitcoind);
  const { notify } = useStoreActions(s => s.app);
  const { mine } = useStoreActions(s => s.bitcoind);
  const mineAsync = useAsyncCallback(async () => {
    try {
      await mine({ blocks: 1, node: bitcoinNode });
    } catch (error) {
      notify({ message: l('mineError'), error });
    }
  });

  const menu = (
    <Menu theme="dark">
      <Menu.Item key="rename" onClick={onRenameClick}>
        <Styled.MenuIcon type="form" />
        {l('menuRename')}
      </Menu.Item>
      <Menu.Item key="delete" onClick={onDeleteClick}>
        <Styled.MenuIcon type="close" />
        {l('menuDelete')}
      </Menu.Item>
    </Menu>
  );

  return (
    <>
      {bitcoinNode.status === Status.Started && chainInfo && (
        <>
          <Tag>height: {chainInfo.blocks}</Tag>
          <Button onClick={mineAsync.execute} loading={mineAsync.loading} icon="tool">
            {l('mineBtn')}
          </Button>
          <Divider type="vertical" />
        </>
      )}
      <Styled.Button
        key="start"
        type={type}
        icon={icon}
        loading={loading}
        ghost={started}
        onClick={onClick}
      >
        {l(`primaryBtn${label}`)}
      </Styled.Button>
      <Dropdown key="options" overlay={menu}>
        <Button icon="more" />
      </Dropdown>
    </>
  );
};

export default NetworkActions;
