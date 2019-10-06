import React from 'react';
import { useStoreState } from 'easy-peasy';
import { LndNode, Status } from 'types';
import { ellipseInner } from 'utils/strings';
import { StatusBadge } from 'components/common';
import DetailsList, { DetailValues } from 'components/common/DetailsList';

interface Props {
  node: LndNode;
}

const InfoTab: React.FC<Props> = ({ node }) => {
  const { nodes } = useStoreState(s => s.lnd);
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
      const { confirmedBalance, unconfirmedBalance } = nodeState.walletBalance;
      details.push({ label: 'Confirmed Balance', value: `${confirmedBalance} sats` });
      details.push({ label: 'Unconfirmed Balance', value: `${unconfirmedBalance} sats` });
    }
    if (nodeState.info) {
      const { identityPubkey, alias, syncedToChain } = nodeState.info;
      details.push(
        { label: 'Alias', value: alias },
        { label: 'Pubkey', value: ellipseInner(identityPubkey) },
        { label: 'Synced to Chain', value: `${syncedToChain}` },
      );
    }
  }

  return <DetailsList details={details} />;
};

export default InfoTab;
