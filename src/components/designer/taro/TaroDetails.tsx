import React, { ReactNode, useState } from 'react';
import { useAsync } from 'react-async-hook';
import { LoadingOutlined } from '@ant-design/icons';
import { Alert } from 'antd';
import { usePrefixedTranslation } from 'hooks';
import { Status, TaroNode } from 'shared/types';
import { useStoreActions, useStoreState } from 'store';
import { abbreviate } from 'utils/numbers';
import { Loader } from 'components/common';
import SidebarCard from '../SidebarCard';
import InfoTab from './InfoTab';

// import ActionsTab from './ActionsTab';
// import ConnectTab from './ConnectTab';

interface Props {
  node: TaroNode;
}

const TaroDetails: React.FC<Props> = ({ node }) => {
  const { l } = usePrefixedTranslation('cmps.designer.taro.TaroDetails');
  const [activeTab, setActiveTab] = useState('info');
  const { getAssets } = useStoreActions(s => s.taro);
  const getInfoAsync = useAsync(
    async (node: TaroNode) => {
      if (node.status !== Status.Started) return;
      await getAssets(node);
    },
    [node],
  );

  let extra: ReactNode | undefined;
  const { nodes } = useStoreState(s => s.lightning);
  const nodeState = nodes[node.name];
  if (node.status === Status.Started && nodeState) {
    if (nodeState.walletBalance) {
      const { confirmed } = nodeState.walletBalance;
      extra = <strong>{abbreviate(confirmed)} sats</strong>;
    }
  }

  const tabHeaders = [
    { key: 'info', tab: l('info') },
    { key: 'connect', tab: l('connect') },
    { key: 'actions', tab: l('actions') },
  ];
  const tabContents: Record<string, ReactNode> = {
    info: <InfoTab node={node} />,
    connect: <div>TODO: Connect</div>, //<ConnectTab node={node} />,
    actions: <div>TODO: Actions</div>, // <ActionsTab node={node} />,
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

export default TaroDetails;
