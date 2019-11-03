import React, { ReactNode } from 'react';
import { useAsync } from 'react-async-hook';
import { Alert, Icon } from 'antd';
import { usePrefixedTranslation } from 'hooks';
import { BitcoinNode, Status } from 'shared/types';
import { useStoreActions, useStoreState } from 'store';
import { ellipseInner } from 'utils/strings';
import { toSats } from 'utils/units';
import { CopyIcon, DetailsList, Loader, StatusBadge } from 'components/common';
import { DetailValues } from 'components/common/DetailsList';
import { OpenTerminalButton } from 'components/terminal';
import SidebarCard from '../SidebarCard';
import MineBlocksInput from './MineBlocksInput';

const BitcoindDetails: React.FC<{ node: BitcoinNode }> = ({ node }) => {
  const { l } = usePrefixedTranslation('cmps.designer.bitcoind.BitcoinDetails');
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
    { label: l('nodeType'), value: node.type },
    { label: l('implementation'), value: node.implementation },
    { label: l('version'), value: `v${node.version}` },
    {
      label: l('status'),
      value: (
        <StatusBadge
          status={node.status}
          text={l(`enums.status.${Status[node.status]}`)}
        />
      ),
    },
  ];

  let extra: ReactNode | undefined;
  if (node.status === Status.Started && chainInfo && walletInfo) {
    details.push(
      { label: l('rpcHost'), value: `127.0.0.1:${node.ports.rpc}` },
      { label: l('walletBalance'), value: `${walletInfo.balance} BTC` },
      { label: l('blockHeight'), value: chainInfo.blocks },
      {
        label: l('blockHash'),
        value: (
          <CopyIcon
            label={l('blockHash')}
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
        <Alert
          type="info"
          showIcon
          closable={false}
          message={l('waitingNotice')}
          icon={<Icon type="loading" />}
        />
      )}
      {node.status === Status.Error && node.errorMsg && (
        <Alert
          type="error"
          message={l('startError')}
          description={node.errorMsg}
          closable={false}
          showIcon
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
      <DetailsList details={details} />
      {node.status === Status.Started && (
        <>
          <MineBlocksInput node={node} />
          <OpenTerminalButton node={node} />
        </>
      )}
    </SidebarCard>
  );
};

export default BitcoindDetails;
