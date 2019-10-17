import React, { ReactNode } from 'react';
import { useAsync } from 'react-async-hook';
import { Alert } from 'antd';
import { usePrefixedTranslation } from 'hooks';
import { useStoreActions, useStoreState } from 'store';
import { BitcoinNode, Status } from 'types';
import { ellipseInner } from 'utils/strings';
import { toSats } from 'utils/units';
import { CopyIcon, DetailsList, Loader, StatusBadge } from 'components/common';
import { DetailValues } from 'components/common/DetailsList';
import SidebarCard from '../SidebarCard';
import MineBlocksInput from './MineBlocksInput';

const BitcoindDetails: React.FC<{ node: BitcoinNode }> = ({ node }) => {
  const { t } = usePrefixedTranslation('cmps.bitcoind-details');
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

  const details: DetailValues = [
    { label: t('node-type'), value: node.type },
    { label: t('implementation'), value: node.implementation },
    { label: t('version'), value: `v${node.version}` },
    {
      label: t('status'),
      value: (
        <StatusBadge
          status={node.status}
          text={t(`enums.status.${Status[node.status].toLowerCase()}`)}
        />
      ),
    },
  ];

  let extra: ReactNode | undefined;
  if (node.status === Status.Started && chainInfo && walletInfo) {
    details.push(
      { label: t('rpc-host'), value: `127.0.0.1:${node.ports.rpc}` },
      { label: t('wallet-balance'), value: `${walletInfo.balance} BTC` },
      { label: t('block-height'), value: chainInfo.blocks },
      {
        label: t('block-hash'),
        value: (
          <CopyIcon
            label={t('block-hash')}
            value={chainInfo.bestblockhash}
            text={ellipseInner(chainInfo.bestblockhash)}
          />
        ),
      },
    );
    extra = <strong>{toSats(walletInfo.balance, true)} sats</strong>;
  }

  return (
    <SidebarCard title={node.name} extra={extra}>
      {getInfoAsync.loading && <Loader />}
      {node.status === Status.Starting && (
        <Alert type="info" showIcon closable={false} message={t('waiting-notice')} />
      )}
      {getInfoAsync.error && (
        <Alert
          type="error"
          closable={false}
          message={t('get-info-err')}
          description={getInfoAsync.error.message}
        />
      )}
      <DetailsList details={details} />
      {node.status === Status.Started && <MineBlocksInput node={node} />}
    </SidebarCard>
  );
};

export default BitcoindDetails;
