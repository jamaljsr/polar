import React, { ReactNode, useState } from 'react';
import { useAsync } from 'react-async-hook';
import { Alert, Icon } from 'antd';
import { usePrefixedTranslation } from 'hooks';
import { LightningNode, Status } from 'shared/types';
import { useStoreActions, useStoreState } from 'store';
import { abbreviate } from 'utils/numbers';
import { Loader } from 'components/common';
import SidebarCard from '../SidebarCard';
import ActionsTab from './ActionsTab';
import ConnectTab from './ConnectTab';
import InfoTab from './InfoTab';

interface Props {
  node: LightningNode;
}

const LndDetails: React.FC<Props> = ({ node }) => {
  const { l } = usePrefixedTranslation('cmps.designer.lnd.LndDetails');
  const [activeTab, setActiveTab] = useState('info');
  const { getInfo, getWalletBalance, getChannels } = useStoreActions(s => s.lnd);
  const getInfoAsync = useAsync(
    async (node: LightningNode) => {
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

export default LndDetails;
