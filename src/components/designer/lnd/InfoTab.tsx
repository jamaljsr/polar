import React from 'react';
import { Tooltip } from 'antd';
import { usePrefixedTranslation } from 'hooks';
import { LndNode, Status } from 'shared/types';
import { useStoreState } from 'store';
import { ellipseInner } from 'utils/strings';
import { format } from 'utils/units';
import { StatusBadge } from 'components/common';
import CopyIcon from 'components/common/CopyIcon';
import DetailsList, { DetailValues } from 'components/common/DetailsList';

interface Props {
  node: LndNode;
}

const InfoTab: React.FC<Props> = ({ node }) => {
  const { l } = usePrefixedTranslation('cmps.designer.lnd.InfoTab');
  const { nodes } = useStoreState(s => s.lnd);
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

  const nodeState = nodes[node.name];
  if (node.status === Status.Started && nodeState) {
    if (nodeState.walletBalance) {
      const { confirmedBalance, unconfirmedBalance } = nodeState.walletBalance;
      details.push({
        label: l('confirmedBalance'),
        value: `${format(confirmedBalance)} sats`,
      });
      details.push({
        label: l('unconfirmedBalance'),
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
        <Tooltip title={l('channelsTooltip')}>
          {`${numActiveChannels} / ${numPendingChannels} / ${numInactiveChannels}`}
        </Tooltip>
      );
      details.push(
        { label: l('alias'), value: alias },
        { label: l('pubkey'), value: pubkey },
        { label: l('syncedToChain'), value: `${syncedToChain}` },
        { label: l('channels'), value: channels },
      );
    }
  }

  return <DetailsList details={details} />;
};

export default InfoTab;
