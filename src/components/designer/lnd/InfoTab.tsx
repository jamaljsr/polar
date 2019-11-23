import React from 'react';
import { Alert, Tooltip } from 'antd';
import { usePrefixedTranslation } from 'hooks';
import { LightningNode, Status } from 'shared/types';
import { useStoreState } from 'store';
import { ellipseInner } from 'utils/strings';
import { format } from 'utils/units';
import { StatusBadge } from 'components/common';
import CopyIcon from 'components/common/CopyIcon';
import DetailsList, { DetailValues } from 'components/common/DetailsList';

interface Props {
  node: LightningNode;
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
      const { confirmed, unconfirmed } = nodeState.walletBalance;
      details.push({
        label: l('confirmedBalance'),
        value: `${format(confirmed)} sats`,
      });
      details.push({
        label: l('unconfirmedBalance'),
        value: `${format(unconfirmed)} sats`,
      });
    }
    if (nodeState.info) {
      const {
        pubkey,
        alias,
        syncedToChain,
        numPendingChannels,
        numActiveChannels,
        numInactiveChannels,
      } = nodeState.info;
      const pubkeyCmp = (
        <>
          {ellipseInner(pubkey)}
          <CopyIcon value={pubkey} label="PubKey" />
        </>
      );
      const channels = (
        <Tooltip title={l('channelsTooltip')}>
          {`${numActiveChannels} / ${numPendingChannels} / ${numInactiveChannels}`}
        </Tooltip>
      );
      details.push(
        { label: l('alias'), value: alias },
        { label: l('pubkey'), value: pubkeyCmp },
        { label: l('syncedToChain'), value: `${syncedToChain}` },
        { label: l('channels'), value: channels },
      );
    }
  }

  return (
    <>
      {node.status === Status.Error && node.errorMsg && (
        <Alert
          type="error"
          message={l('startError')}
          description={node.errorMsg}
          closable={false}
          showIcon
        />
      )}
      <DetailsList details={details} />
    </>
  );
};

export default InfoTab;
