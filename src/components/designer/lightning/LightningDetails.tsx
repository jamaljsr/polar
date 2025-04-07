import React, { ReactNode, useState } from 'react';
import { useAsync } from 'react-async-hook';
import { LoadingOutlined } from '@ant-design/icons';
import { Alert } from 'antd';
import { usePrefixedTranslation } from 'hooks';
import { LightningNode, LitdNode, Status } from 'shared/types';
import { useStoreActions, useStoreState } from 'store';
import { mapToTapd } from 'utils/network';
import { abbreviate } from 'utils/numbers';
import { Loader } from 'components/common';
import SidebarCard from '../SidebarCard';
import ActionsTab from './ActionsTab';
import ConnectTab from './ConnectTab';
import InfoTab from './InfoTab';

interface Props {
  node: LightningNode;
}

const LightningDetails: React.FC<Props> = ({ node }) => {
  const { l } = usePrefixedTranslation('cmps.designer.lightning.LightningDetails');
  const [activeTab, setActiveTab] = useState('info');
  const { getInfo, getWalletBalance, getChannels } = useStoreActions(s => s.lightning);
  const { getAssets, getBalances } = useStoreActions(s => s.tap);
  const { getSessions } = useStoreActions(s => s.lit);
  const getInfoAsync = useAsync(
    async (node: LightningNode) => {
      if (node.status !== Status.Started) return;
      await getInfo(node);
      await getWalletBalance(node);
      await getChannels(node);

      if (node.implementation === 'litd') {
        const tapNode = mapToTapd(node);
        await getAssets(tapNode);
        await getBalances(tapNode);
        await getSessions(node as LitdNode);
      }
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
