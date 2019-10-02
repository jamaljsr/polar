import React from 'react';
import { useAsync } from 'react-async-hook';
import { Alert } from 'antd';
import { useStoreActions, useStoreState } from 'store';
import { LndNode, Status } from 'types';
import { ellipseInner } from 'utils/strings';
import { Loader, StatusBadge } from 'components/common';
import DetailsList, { DetailValues } from 'components/common/DetailsList';

const LndDetails: React.FC<{ node: LndNode }> = ({ node }) => {
  const { getInfo, getWalletBalance } = useStoreActions(s => s.lnd);
  const getInfoAsync = useAsync(
    async (node: LndNode) => {
      if (node.status === Status.Started) {
        await getInfo(node);
        await getWalletBalance(node);
      }
    },
    [node],
  );
  const { nodes } = useStoreState(s => s.lnd);

  if (getInfoAsync.loading) {
    return <Loader />;
  }

  const details: DetailValues = [
    { label: 'Node Type', value: node.type },
    { label: 'Implementation', value: node.implementation },
    { label: 'Version', value: `v${node.version}` },
    {
      label: 'Status',
      value: <StatusBadge status={node.status} text={Status[node.status]} />,
    },
  ];

  const nodeState = nodes[node.name];
  if (node.status === Status.Started && nodeState) {
    if (nodeState.walletBalance) {
      const { totalBalance } = nodeState.walletBalance;
      details.push({ label: 'Wallet Balance', value: `${totalBalance} BTC` });
    }
    if (nodeState.info) {
      const { identityPubkey, alias, syncedToChain } = nodeState.info;
      details.push(
        { label: 'GRPC Host', value: `127.0.0.1:${node.ports.grpc}` },
        { label: 'REST Host', value: `127.0.0.1:${node.ports.rest}` },
        { label: 'Alias', value: alias },
        { label: 'Pubkey', value: ellipseInner(identityPubkey) },
        { label: 'Synced to Chain', value: `${syncedToChain}` },
      );
    }
  }

  return (
    <>
      {node.status === Status.Starting && (
        <Alert
          type="info"
          showIcon
          closable={false}
          message="Waiting for LND to come online"
        />
      )}
      {getInfoAsync.error && node.status === Status.Started && (
        <Alert
          type="error"
          closable={false}
          message="Unable to connect to node"
          description={getInfoAsync.error.message}
        />
      )}
      <DetailsList details={details} />
    </>
  );
};

export default LndDetails;
