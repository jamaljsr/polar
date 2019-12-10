import React, { ReactNode, useState } from 'react';
import { useAsync } from 'react-async-hook';
import { Alert, Icon } from 'antd';
import { usePrefixedTranslation } from 'hooks';
import { BitcoinNode, Status } from 'shared/types';
import { useStoreActions, useStoreState } from 'store';
import { Loader } from 'components/common';
import SidebarCard from '../SidebarCard';
import ActionsTab from './ActionsTab';
import ConnectTab from './ConnectTab';
import InfoTab from './InfoTab';

const BitcoindDetails: React.FC<{ node: BitcoinNode }> = ({ node }) => {
  const { l } = usePrefixedTranslation('cmps.designer.bitcoind.BitcoinDetails');
  const [activeTab, setActiveTab] = useState('info');
  const { getInfo } = useStoreActions(s => s.bitcoind);
  const { chainInfo, walletInfo } = useStoreState(s => s.bitcoind);
  const getInfoAsync = useAsync(
    async (node: BitcoinNode) => {
      if (node.status === Status.Started) {
        return await getInfo(node);
      }
    },
    [node],
  );

  let extra: ReactNode | undefined;
  if (node.status === Status.Started && chainInfo && walletInfo) {
    extra = <strong>{walletInfo.balance} BTC</strong>;
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
      {getInfoAsync.loading && <Loader />}
      {node.status === Status.Starting && (
        <Alert
          type="info"
          showIcon
          closable={false}
          message={l('waitingNotice')}
          icon={<Icon type="loading" />}
        />
      )}
      {getInfoAsync.error && (
        <Alert
          type="error"
          closable={false}
          message={l('getInfoErr')}
          description={getInfoAsync.error.message}
        />
      )}
      {tabContents[activeTab]}
    </SidebarCard>
  );
};

export default BitcoindDetails;
