import React, { ReactNode, useState } from 'react';
import { useAsync } from 'react-async-hook';
import { LoadingOutlined } from '@ant-design/icons';
import { Alert } from 'antd';
import { usePrefixedTranslation } from 'hooks';
import { Status, ArkNode } from 'shared/types';
import { useStoreActions, useStoreState } from 'store';
import { Loader } from 'components/common';
import SidebarCard from '../SidebarCard';
import ActionsTab from './ActionsTab';
import ConnectTab from './ConnectTab';
import InfoTab from './InfoTab';

interface Props {
  node: ArkNode;
}

const ArkDetails: React.FC<Props> = ({ node }) => {
  const { l } = usePrefixedTranslation('cmps.designer.ark.ArkDetails');
  const [activeTab, setActiveTab] = useState('info');
  const { getInfo } = useStoreActions(s => s.ark);
  const getInfoAsync = useAsync(
    async (node: ArkNode) => {
      if (node.status !== Status.Started) return;
      await getInfo(node);
    },
    [node],
  );

  let extra: ReactNode | undefined;
  const { nodes } = useStoreState(s => s.ark);
  const nodeState = nodes[node.name];
  if (node.status === Status.Started && nodeState) {
    // if (nodeState.balances) {
    //   extra = <strong>{nodeState.balances.length} assets</strong>;
    // }
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

export default ArkDetails;
