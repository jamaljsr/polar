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
  const { l } = usePrefixedTranslation('cmps.designer.lightning.InfoTab');
  const { nodes } = useStoreState(s => s.lightning);
  const version = node.docker.image
    ? { label: l('customImage'), value: node.docker.image }
    : { label: l('version'), value: `v${node.version}` };
  const details: DetailValues = [
    { label: l('nodeType'), value: node.type },
    { label: l('implementation'), value: node.implementation },
    version,
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

  let showSyncWarning = false;
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
        blockHeight,
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
        { label: l('blockHeight'), value: `${blockHeight}` },
        { label: l('channels'), value: channels },
      );
      showSyncWarning = !syncedToChain;
    }
  }

  return (
    <>
      {showSyncWarning && (
        <Alert type="warning" message={l('syncWarning')} closable={false} showIcon />
      )}
      {node.status === Status.Error && node.errorMsg && (
        <Alert
          type="error"
          message={l('startError', { implementation: node.implementation })}
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
