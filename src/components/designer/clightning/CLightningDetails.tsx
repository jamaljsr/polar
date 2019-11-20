import React from 'react';
import { useAsync } from 'react-async-hook';
import { Alert, Icon, Tooltip } from 'antd';
import { usePrefixedTranslation } from 'hooks';
import { CLightningNode, Status } from 'shared/types';
import { useStoreActions, useStoreState } from 'store';
import { ellipseInner } from 'utils/strings';
import { CopyIcon, DetailsList, Loader, StatusBadge } from 'components/common';
import { DetailValues } from 'components/common/DetailsList';
import SidebarCard from '../SidebarCard';

interface Props {
  node: CLightningNode;
}

const CLightningDetails: React.FC<Props> = ({ node }) => {
  const { l } = usePrefixedTranslation('cmps.designer.clightning.CLightningDetails');
  const { getInfo } = useStoreActions(s => s.clightning);
  const { nodes } = useStoreState(s => s.clightning);

  const getInfoAsync = useAsync(
    async (node: CLightningNode) => {
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

  const nodeState = nodes[node.name];
  if (node.status === Status.Started && nodeState) {
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
        const synced = (
          <Tooltip title={warningBitcoindSync}>{warningBitcoindSync}</Tooltip>
        );
        details.push({ label: l('syncedToChain'), value: synced });
      }
    }
  }

  return (
    <SidebarCard title={node.name}>
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
    </SidebarCard>
  );
};

export default CLightningDetails;
