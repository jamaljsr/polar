import React from 'react';
import styled from '@emotion/styled';
import { ILink } from '@mrblenny/react-flow-chart';
import { usePrefixedTranslation } from 'hooks';
import { LightningNode, Status } from 'shared/types';
import { LinkProperties } from 'utils/chart';
import { ellipseInner } from 'utils/strings';
import { format } from 'utils/units';
import { CopyIcon, DetailsList, StatusBadge } from 'components/common';
import AssetAmount from 'components/common/AssetAmount';
import { DetailValues } from 'components/common/DetailsList';
import SidebarCard from '../SidebarCard';
import CloseChannelButton from './CloseChannelButton';

const Styled = {
  AssetTitle: styled.span`
    display: inline-block;
    font-size: 0.8rem;
    opacity: 0.8;
  `,
};

interface Props {
  link: ILink;
  from: LightningNode;
  to: LightningNode;
}

const Channel: React.FC<Props> = ({ link, from, to }) => {
  const { l } = usePrefixedTranslation('cmps.designer.link.Channel');
  const {
    type,
    fromBalance,
    toBalance,
    capacity,
    status,
    channelPoint,
    isPrivate,
    assets,
  } = link.properties as LinkProperties;

  const channelDetails: DetailValues = [
    { label: l('status'), value: status },
    { label: l('capacity'), value: `${format(capacity)} sats` },
    { label: l('sourceBalance'), value: `${format(fromBalance)} sats` },
    { label: l('destinationBalance'), value: `${format(toBalance)} sats` },
    {
      label: from.implementation === 'LND' ? l('channelPoint') : l('channelId'),
      value: (
        <CopyIcon
          value={channelPoint}
          text={ellipseInner(channelPoint, 4, 6)}
          label={l('channelPoint')}
        />
      ),
    },
    { label: l('isPrivate'), value: isPrivate.toString() },
  ];

  const assetDetails = assets
    ? assets.map(a => (
        <DetailsList
          key={a.id}
          title={
            <>
              {a.name} <Styled.AssetTitle> ({l('assetTitle')})</Styled.AssetTitle>
            </>
          }
          details={[
            {
              label: l('assetId'),
              value: (
                <CopyIcon
                  value={a.id}
                  text={ellipseInner(a.id, 4, 6)}
                  label={l('assetId')}
                />
              ),
            },
            {
              label: l('capacity'),
              value: <AssetAmount assetId={a.id} amount={a.capacity} />,
            },
            {
              label: l('sourceBalance'),
              value: <AssetAmount assetId={a.id} amount={a.localBalance} />,
            },
            {
              label: l('destinationBalance'),
              value: <AssetAmount assetId={a.id} amount={a.remoteBalance} />,
            },
          ]}
        />
      ))
    : null;

  const [fromDetails, toDetails] = [from, to].map(node => [
    { label: l('name'), value: node.name },
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
  ]);

  return (
    <SidebarCard title={l('title')}>
      <DetailsList details={channelDetails} />
      {assetDetails}
      <DetailsList title={l('sourceTitle')} details={fromDetails} />
      <DetailsList title={l('destinationTitle')} details={toDetails} />
      {type === 'open-channel' && (
        <CloseChannelButton node={from} channelPoint={channelPoint} />
      )}
    </SidebarCard>
  );
};

export default Channel;
