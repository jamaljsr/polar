import React from 'react';
import { useAsyncCallback } from 'react-async-hook';
import { Alert } from 'antd';
import { useStoreActions, useStoreState } from 'store';
import { LNDNode, Status } from 'types';
import { ellipseInner } from 'utils/strings';
import { Loader, StatusBadge } from 'components/common';
import DetailsList, { DetailValues } from 'components/common/DetailsList';

interface Props {
  node: LNDNode;
}

const LndDetails: React.FC<Props> = ({ node }) => {
  const { getInfo } = useStoreActions(s => s.lnd);
  const getInfoAsync = useAsyncCallback(async () => await getInfo(node));
  const { nodes } = useStoreState(s => s.lnd);

  if (getInfoAsync.status === 'not-requested' && node.status === Status.Started) {
    getInfoAsync.execute();
  }

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
  if (getInfoAsync.status === 'success' && nodeState && nodeState.info) {
    const { identityPubkey, alias, syncedToChain } = nodeState.info;
    details.push(
      { label: 'GRPC Host', value: `127.0.0.1:${node.ports.grpc}` },
      { label: 'REST Host', value: `127.0.0.1:${node.ports.rest}` },
      { label: 'Alias', value: alias },
      { label: 'Pubkey', value: ellipseInner(identityPubkey) },
      { label: 'Synced to Chain', value: `${syncedToChain}` },
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
    </>
  );
};

export default LndDetails;
