import React, { ReactNode } from 'react';
import { useAsyncCallback } from 'react-async-hook';
import {
  CloseOutlined,
  ExportOutlined,
  FormOutlined,
  MoreOutlined,
  PlayCircleOutlined,
  StopOutlined,
  ToolOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import styled from '@emotion/styled';
import { Button, Divider, Dropdown, Menu, Tag } from 'antd';
import { ButtonType } from 'antd/lib/button';
import { usePrefixedTranslation } from 'hooks';
import { Status } from 'shared/types';
import { useStoreActions, useStoreState } from 'store';
import { Network } from 'types';

const Styled = {
  Button: styled(Button)`
    margin-left: 0;
  `,
  FormIcon: styled(FormOutlined)`
    margin-right: 5px;
  `,
  CloseIcon: styled(CloseOutlined)`
    margin-right: 5px;
  `,
  ExportIcon: styled(ExportOutlined)`
    margin-right: 5px;
  `,
};

interface Props {
  network: Network;
  onClick: () => void;
  onRenameClick: () => void;
  onDeleteClick: () => void;
  onExportClick: () => void;
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

const NetworkActions: React.FC<Props> = ({
  network,
  onClick,
  onRenameClick,
  onDeleteClick,
  onExportClick,
}) => {
  const { l } = usePrefixedTranslation('cmps.network.NetworkActions');

  const { status, nodes } = network;
  const bitcoinNode = nodes.bitcoin[0];
  const loading = status === Status.Starting || status === Status.Stopping;
  const started = status === Status.Started;
  const { label, type, danger, icon } = config[status];

  const nodeState = useStoreState(s => s.bitcoind.nodes[bitcoinNode.name]);
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
        <Styled.FormIcon />
        {l('menuRename')}
      </Menu.Item>
      <Menu.Item key="export" onClick={onExportClick}>
        <Styled.ExportIcon />
        {l('menuExport')}
      </Menu.Item>
      <Menu.Item key="delete" onClick={onDeleteClick}>
        <Styled.CloseIcon />
        {l('menuDelete')}
      </Menu.Item>
    </Menu>
  );

  return (
    <>
      {bitcoinNode.status === Status.Started && nodeState && nodeState.chainInfo && (
        <>
          <Tag>height: {nodeState.chainInfo.blocks}</Tag>
          <Button
            onClick={mineAsync.execute}
            loading={mineAsync.loading}
            icon={<ToolOutlined />}
          >
            {l('mineBtn')}
          </Button>
          <Divider type="vertical" />
        </>
      )}
      <Styled.Button
        key="start"
        type={type}
        danger={danger}
        icon={icon}
        loading={loading}
        ghost={started}
        onClick={onClick}
      >
        {l(`primaryBtn${label}`)}
      </Styled.Button>
      <Dropdown key="options" overlay={menu}>
        <Button icon={<MoreOutlined />} />
      </Dropdown>
    </>
  );
};

export default NetworkActions;
