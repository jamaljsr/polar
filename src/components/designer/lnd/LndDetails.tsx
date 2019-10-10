import React, { ReactNode, useState } from 'react';
import { useAsync } from 'react-async-hook';
import { Alert } from 'antd';
import { useStoreActions, useStoreState } from 'store';
import { LndNode, Status } from 'types';
import { format } from 'utils/units';
import { Loader } from 'components/common';
import SidebarCard from '../SidebarCard';
import ActionsTab from './ActionsTab';
import ConnectTab from './ConnectTab';
import InfoTab from './InfoTab';

interface Props {
  node: LndNode;
}

const LndDetails: React.FC<Props> = ({ node }) => {
  const [activeTab, setActiveTab] = useState(
    node.status === Status.Started ? 'connect' : 'info',
  );
  const { getInfo, getWalletBalance, getChannels } = useStoreActions(s => s.lnd);
  const getInfoAsync = useAsync(
    async (node: LndNode) => {
      if (node.status !== Status.Started) return;
      await getInfo(node);
      await getWalletBalance(node);
      await getChannels(node);
    },
    [node],
  );

  let extra: ReactNode | undefined;
  const { nodes } = useStoreState(s => s.lnd);
  const nodeState = nodes[node.name];
  if (node.status === Status.Started && nodeState) {
    if (nodeState.walletBalance) {
      const { confirmedBalance } = nodeState.walletBalance;
      extra = <strong>{format(confirmedBalance)} sats</strong>;
    }
  }

  const tabHeaders = [
    { key: 'info', tab: 'Info' },
    { key: 'connect', tab: 'Connect' },
    { key: 'actions', tab: 'Actions' },
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
          closable={false}
          message="Waiting for LND to come online"
        />
      )}
      {node.status !== Status.Started && !nodeState && getInfoAsync.loading && <Loader />}
      {getInfoAsync.error && node.status === Status.Started && (
        <Alert
          type="error"
          closable={false}
          message="Unable to connect to node"
          description={getInfoAsync.error.message}
        />
      )}
      {tabContents[activeTab]}
    </SidebarCard>
  );
};

export default LndDetails;
