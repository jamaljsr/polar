import React, { ReactNode, useState } from 'react';
import { useAsync } from 'react-async-hook';
import { Alert, Icon } from 'antd';
import { usePrefixedTranslation } from 'hooks';
import { CLightningNode, Status } from 'shared/types';
import { useStoreActions, useStoreState } from 'store';
import { abbreviate } from 'utils/numbers';
import { Loader } from 'components/common';
import SidebarCard from '../SidebarCard';
import { ActionsTab, ConnectTab, InfoTab } from './';

interface Props {
  node: CLightningNode;
}

const CLightningDetails: React.FC<Props> = ({ node }) => {
  const { l } = usePrefixedTranslation('cmps.designer.clightning.CLightningDetails');
  const [activeTab, setActiveTab] = useState('info');
  const { getInfo, getBalance } = useStoreActions(s => s.clightning);

  const getInfoAsync = useAsync(
    async (node: CLightningNode) => {
      if (node.status === Status.Started) {
        await getInfo(node);
        await getBalance(node);
      }
    },
    [node],
  );

  let extra: ReactNode | undefined;
  const { nodes } = useStoreState(s => s.clightning);
  const nodeState = nodes[node.name];
  if (node.status === Status.Started && nodeState) {
    if (nodeState.balance) {
      const { confBalance } = nodeState.balance;
      extra = <strong>{abbreviate(confBalance)} sats</strong>;
    }
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
          icon={<Icon type="loading" />}
          closable={false}
          message={l('waitingNotice')}
        />
      )}
      {node.status !== Status.Started && !nodeState && getInfoAsync.loading && <Loader />}
      {getInfoAsync.error && node.status === Status.Started && (
        <Alert
          type="error"
          closable={false}
          message={l('connectError')}
          description={getInfoAsync.error.message}
        />
      )}
      {tabContents[activeTab]}
    </SidebarCard>
  );
};

export default CLightningDetails;
