import React from 'react';
import { Tooltip } from 'antd';
import { useStoreState } from 'store';
import { LndNode, Status } from 'types';
import { ellipseInner } from 'utils/strings';
import { format } from 'utils/units';
import { StatusBadge } from 'components/common';
import CopyIcon from 'components/common/CopyIcon';
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
      details.push({
        label: 'Confirmed Balance',
        value: `${format(confirmedBalance)} sats`,
      });
      details.push({
        label: 'Unconfirmed Balance',
        value: `${format(unconfirmedBalance)} sats`,
      });
    }
    if (nodeState.info) {
      const {
        identityPubkey,
        alias,
        syncedToChain,
        numPendingChannels,
        numActiveChannels,
        numInactiveChannels,
      } = nodeState.info;
      const pubkey = (
        <>
          {ellipseInner(identityPubkey)}
          <CopyIcon value={identityPubkey} label="PubKey" />
        </>
      );
      const channels = (
        <Tooltip title="Active / Pending / Inactive">
          {`${numActiveChannels} / ${numPendingChannels} / ${numInactiveChannels}`}
        </Tooltip>
      );
      details.push(
        { label: 'Alias', value: alias },
        { label: 'Pubkey', value: pubkey },
        { label: 'Synced to Chain', value: `${syncedToChain}` },
        { label: 'Channels', value: channels },
      );
    }
  }

  return <DetailsList details={details} />;
};

export default InfoTab;
