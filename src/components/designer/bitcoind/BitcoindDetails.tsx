import React from 'react';
import { useAsyncCallback } from 'react-async-hook';
import { Alert } from 'antd';
import { useStoreActions, useStoreState } from 'store';
import { BitcoinNode, Status } from 'types';
import { ellipseInner } from 'utils/strings';
import { DetailsList, Loader, StatusBadge } from 'components/common';
import { DetailValues } from 'components/common/DetailsList';
import MineBlocksInput from './MineBlocksInput';

const BitcoindDetails: React.FC<{ node: BitcoinNode }> = ({ node }) => {
  const { getInfo } = useStoreActions(s => s.bitcoind);
  const { chainInfo, walletInfo } = useStoreState(s => s.bitcoind);
  const getInfoAsync = useAsyncCallback(async () => await getInfo(node));

  if (getInfoAsync.status === 'not-requested' && node.status === Status.Started) {
    getInfoAsync.execute();
  }

  if (getInfoAsync.loading) {
    return <Loader />;
  }

  const details: DetailValues = [
    { label: 'Node Type', value: node.type },
    { label: 'Implementation', value: node.implementation },
    { label: 'Version', value: 'v0.18.1' },
    {
      label: 'Status',
      value: <StatusBadge status={node.status} text={Status[node.status]} />,
    },
  ];

  if (getInfoAsync.status === 'success' && chainInfo && walletInfo) {
    details.push(
      { label: 'RPC Host', value: `127.0.0.1:${node.ports.rpc}` },
      { label: 'Wallet Balance', value: `${walletInfo.balance} BTC` },
      { label: 'Block Height', value: chainInfo.blocks },
      { label: 'Block Hash', value: ellipseInner(chainInfo.bestblockhash) },
    );
  }

  return (
    <>
      <DetailsList details={details} />
      {getInfoAsync.error && (
        <Alert
          type="error"
          closable={false}
          message="Unable to connect to node"
          description={getInfoAsync.error.message}
        />
      )}
      {getInfoAsync.status === 'success' && <MineBlocksInput node={node} />}
    </>
  );
};

export default BitcoindDetails;
