import React, { ReactNode } from 'react';
import { Alert, Tooltip } from 'antd';
import { usePrefixedTranslation } from 'hooks';
import { CLightningNode, Status } from 'shared/types';
import { useStoreState } from 'store';
import { ellipseInner } from 'utils/strings';
import { format } from 'utils/units';
import { StatusBadge } from 'components/common';
import CopyIcon from 'components/common/CopyIcon';
import DetailsList, { DetailValues } from 'components/common/DetailsList';

interface Props {
  node: CLightningNode;
}

const InfoTab: React.FC<Props> = ({ node }) => {
  const { l } = usePrefixedTranslation('cmps.designer.clightning.InfoTab');
  const { nodes } = useStoreState(s => s.clightning);
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

  let warning: ReactNode | undefined;
  const nodeState = nodes[node.name];
  if (node.status === Status.Started && nodeState) {
    if (nodeState.balance) {
      const { confBalance, unconfBalance } = nodeState.balance;
      details.push({
        label: l('confirmedBalance'),
        value: `${format(confBalance)} sats`,
      });
      details.push({
        label: l('unconfirmedBalance'),
        value: `${format(unconfBalance)} sats`,
      });
    }
    if (nodeState.info) {
      const {
        id,
        alias,
        warningBitcoindSync,
        numPendingChannels,
        numActiveChannels,
        numInactiveChannels,
      } = nodeState.info;
      const pubkey = (
        <>
          {ellipseInner(id)}
          <CopyIcon value={id} label="PubKey" />
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
        { label: l('channels'), value: channels },
      );
      if (warningBitcoindSync) {
        warning = warningBitcoindSync;
      }
    }
  }

  return (
    <>
      {warning && <Alert type="warning" message={warning} closable={false} showIcon />}
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
