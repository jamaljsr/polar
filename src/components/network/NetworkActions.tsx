import React, { useCallback } from 'react';
import {
  CloseOutlined,
  ExportOutlined,
  FormOutlined,
  MoreOutlined,
  ToolOutlined,
} from '@ant-design/icons';
import styled from '@emotion/styled';
import { Button, Divider, Dropdown, MenuProps, Tag } from 'antd';
import { usePrefixedTranslation } from 'hooks';
import { useMiningAsync } from 'hooks/useMiningAsync';
import { Status } from 'shared/types';
import { useStoreState } from 'store';
import { Network } from 'types';
import { getNetworkBackendId } from 'utils/network';
import BalanceChannelsButton from 'components/common/BalanceChannelsButton';
import AutoMineButton from 'components/designer/AutoMineButton';
import SyncButton from 'components/designer/SyncButton';
import StatusButton from 'components/common/StatusButton';

const Styled = {
  Button: styled(Button)`
    margin-left: 0;
  `,
  Dropdown: styled(Dropdown)`
    margin-left: 12px;
  `,
};

interface Props {
  network: Network;
  onClick: () => void;
  onRenameClick: () => void;
  onDeleteClick: () => void;
  onExportClick: () => void;
}

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

  const nodeState = useStoreState(s => s.bitcoin.nodes[getNetworkBackendId(bitcoinNode)]);

  const mineAsync = useMiningAsync(network);

  const handleClick: MenuProps['onClick'] = useCallback((info: { key: string }) => {
    switch (info.key) {
      case 'rename':
        onRenameClick();
        break;
      case 'export':
        onExportClick();
        break;
      case 'delete':
        onDeleteClick();
        break;
    }
  }, []);

  const items: MenuProps['items'] = [
    { key: 'rename', label: l('menuRename'), icon: <FormOutlined /> },
    { key: 'export', label: l('menuExport'), icon: <ExportOutlined /> },
    { key: 'delete', label: l('menuDelete'), icon: <CloseOutlined /> },
  ];

  return (
    <>
      {bitcoinNode.status === Status.Started && nodeState?.chainInfo && (
        <>
          <Tag>height: {nodeState.chainInfo.blocks}</Tag>
          <Button
            onClick={mineAsync.execute}
            loading={mineAsync.loading}
            icon={<ToolOutlined />}
          >
            {l('mineBtn')}
          </Button>
          <AutoMineButton network={network} />
          <BalanceChannelsButton network={network} />
          <SyncButton network={network} />
          <Divider type="vertical" />
        </>
      )}
      <StatusButton status={status} onClick={onClick} />
      <Styled.Dropdown
        key="options"
        menu={{ theme: 'dark', items, onClick: handleClick }}
      >
        <Button icon={<MoreOutlined />} />
      </Styled.Dropdown>
    </>
  );
};

export default NetworkActions;
