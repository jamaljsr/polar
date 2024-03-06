import React, { ReactNode, useState } from 'react';
import { useAsync, useAsyncCallback } from 'react-async-hook';
import { LoadingOutlined, MoreOutlined, FormOutlined } from '@ant-design/icons';
import { Alert, Dropdown, Button, MenuProps, Input } from 'antd';
import { usePrefixedTranslation } from 'hooks';
import { LightningNode, Status } from 'shared/types';
import { useStoreActions, useStoreState } from 'store';
import { abbreviate } from 'utils/numbers';
import { Loader } from 'components/common';
import SidebarCard from '../SidebarCard';
import ActionsTab from './ActionsTab';
import ConnectTab from './ConnectTab';
import InfoTab from './InfoTab';
import styled from '@emotion/styled';

const Styled = {
  Button: styled(Button)`
    margin-left: 0;
  `,
  Dropdown: styled(Dropdown)`
    margin-left: 12px;
  `,
  RenameInput: styled(Input)`
    width: 100%;
    margin-bottom: 12px;
  `,
};

interface Props {
  node: LightningNode;
}

const LightningDetails: React.FC<Props> = ({ node }) => {
  const { l } = usePrefixedTranslation('cmps.designer.lightning.LightningDetails');
  const [activeTab, setActiveTab] = useState('info');
  const { notify } = useStoreActions(s => s.app);
  const { getInfo, getWalletBalance, getChannels } = useStoreActions(s => s.lightning);
  const { stop, renameLightningNode } = useStoreActions(s => s.network);
  const getInfoAsync = useAsync(
    async (node: LightningNode) => {
      if (node.status !== Status.Started) return;
      await getInfo(node);
      await getWalletBalance(node);
      await getChannels(node);
    },
    [node],
  );

  const [editing, setEditing] = useState(false);
  const [editingName, setEditingName] = useState('');
  const renameAsync = useAsyncCallback(
    async (payload: {
      id: number;
      name: string;
      networkId: number;
      oldName: string;
      backendName: string;
    }) => {
      try {
        if (node.status === Status.Started) return await stop(node.networkId);
        await renameLightningNode(payload);
        //   await save();
        setEditing(false);
      } catch (error: any) {
        notify({ message: l('renameError'), error });
      }
    },
  );

  const onRenameClick = () => {
    setEditing(true);
    setEditingName(node.name);
  };

  const items: MenuProps['items'] = [
    { key: 'rename', label: l('menuRename'), icon: <FormOutlined /> },
  ];

  let reName: ReactNode | undefined;

  if (editing) {
    reName = (
      <>
        <Styled.RenameInput
          name="newNetworkName"
          value={editingName}
          onChange={e => setEditingName(e.target.value)}
        />
        <Button
          key="save"
          type="primary"
          loading={renameAsync.loading}
          onClick={() =>
            renameAsync.execute({
              id: node.id,
              name: editingName,
              networkId: node.networkId,
              oldName: node.name,
              backendName: node.backendName,
            })
          }
        >
          Save
        </Button>
        <Button key="cancel" type="link" onClick={() => setEditing(false)}>
          Cancel
        </Button>
      </>
    );
  } else {
  }

  let extra: ReactNode | undefined;
  const { nodes } = useStoreState(s => s.lightning);
  const nodeState = nodes[node.name];
  if (node.status === Status.Started && nodeState) {
    if (nodeState.walletBalance) {
      const { confirmed } = nodeState.walletBalance;
      extra = (
        <>
          <strong>{abbreviate(confirmed)} sats</strong>
          {!editing ? (
            <Styled.Dropdown
              key="options"
              menu={{ theme: 'dark', items, onClick: onRenameClick }}
            >
              <Button icon={<MoreOutlined />} />
            </Styled.Dropdown>
          ) : (
            reName
          )}
        </>
      );
    }
  } else {
    extra = (
      <>
        {!editing ? (
          <Styled.Dropdown
            key="options"
            menu={{ theme: 'dark', items, onClick: onRenameClick }}
          >
            <Button icon={<MoreOutlined />} />
          </Styled.Dropdown>
        ) : (
          reName
        )}
      </>
    );
  }

  const tabHeaders = [
    { key: 'info', tab: l('info') },
    { key: 'connect', tab: l('connect') },
    { key: 'actions', tab: l('actions') },
  ];
  const tabContents: Record<string, ReactNode> = {
    info: <InfoTab node={node} />,
    connect: <ConnectTab node={node} />,
    actions: <ActionsTab node={node} />,
  };

  return (
    <SidebarCard
      title={node.name}
      extra={extra}
      tabList={tabHeaders}
      activeTabKey={activeTab}
      onTabChange={setActiveTab}
    >
      {node.status === Status.Starting && (
        <Alert
          type="info"
          showIcon
          icon={<LoadingOutlined />}
          closable={false}
          message={l('waitingNotice', { implementation: node.implementation })}
        />
      )}
      {node.status !== Status.Started && !nodeState && getInfoAsync.loading && <Loader />}
      {getInfoAsync.error && node.status === Status.Started && (
        <Alert
          type="error"
          closable={false}
          message={l('connectError', { implementation: node.implementation })}
          description={getInfoAsync.error.message}
        />
      )}
      {tabContents[activeTab]}
    </SidebarCard>
  );
};

export default LightningDetails;
