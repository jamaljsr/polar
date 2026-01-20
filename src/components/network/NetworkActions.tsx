import React, { useCallback } from 'react';
import {
  CloseOutlined,
  ExportOutlined,
  FormOutlined,
  LockOutlined,
  MoreOutlined,
  ToolOutlined,
  UnlockOutlined,
} from '@ant-design/icons';
import styled from '@emotion/styled';
import { Button, Divider, Dropdown, MenuProps, Switch, Tag, Tooltip } from 'antd';
import { usePrefixedTranslation } from 'hooks';
import { useMiningAsync } from 'hooks/useMiningAsync';
import { BitcoinNode, LightningNode, Status } from 'shared/types';
import { useStoreActions, useStoreState } from 'store';
import { Network } from 'types';
import { getNetworkBackendId, supportsTor } from 'utils/network';
import BalanceChannelsButton from 'components/common/BalanceChannelsButton';
import StatusButton from 'components/common/StatusButton';
import AutoMineButton from 'components/designer/AutoMineButton';
import SyncButton from 'components/designer/SyncButton';

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

  const { notify } = useStoreActions(s => s.app);
  const { toggleTorForNetwork } = useStoreActions(s => s.network);

  const torSupportedNodes = [
    ...network.nodes.bitcoin.filter(supportsTor),
    ...network.nodes.lightning.filter(supportsTor),
  ];

  const hasTorSupportedNodes = torSupportedNodes.length > 0;

  const isTorEnabled =
    hasTorSupportedNodes &&
    torSupportedNodes.every(node => (node as LightningNode | BitcoinNode).enableTor);

  const handleTorToggle = useCallback(
    async (checked: boolean) => {
      try {
        await toggleTorForNetwork({ networkId: network.id, enabled: checked });
        notify({
          message: l(checked ? 'torEnabledAll' : 'torDisabledAll'),
        });
      } catch (error: any) {
        notify({ message: l('torToggleError'), error });
      }
    },
    [network.id],
  );

  const TorMenuSwitch = () => {
    const isNetworkStarted = network.status === Status.Started;

    return (
      <>
        {hasTorSupportedNodes && (
          <Tooltip
            title={
              isNetworkStarted ? l('torToggleDisabledStarted') : l('torToggleTooltip')
            }
          >
            <Switch
              checked={isTorEnabled}
              onChange={handleTorToggle}
              disabled={isNetworkStarted}
              checkedChildren={
                <>
                  <UnlockOutlined /> {l('torTitle')}
                </>
              }
              unCheckedChildren={
                <>
                  <LockOutlined /> {l('torTitle')}
                </>
              }
            />
          </Tooltip>
        )}

        {!hasTorSupportedNodes && (
          <>
            <Tooltip title={l('torNotSupported')}>
              <Switch
                disabled
                checkedChildren={<LockOutlined />}
                unCheckedChildren={<UnlockOutlined />}
              />
            </Tooltip>
            <Divider type="vertical" />
          </>
        )}
      </>
    );
  };

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
    { type: 'divider' },
    { key: 'tor', label: <TorMenuSwitch /> },
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
