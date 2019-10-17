import React from 'react';
import { ILink } from '@mrblenny/react-flow-chart';
import { usePrefixedTranslation } from 'hooks';
import { LightningNode, Status } from 'types';
import { LinkProperties } from 'utils/chart';
import { format } from 'utils/units';
import { DetailsList, StatusBadge } from 'components/common';
import { DetailValues } from 'components/common/DetailsList';
import SidebarCard from '../SidebarCard';

interface Props {
  link: ILink;
  from: LightningNode;
  to: LightningNode;
}

const Channel: React.FC<Props> = ({ link, from, to }) => {
  const { l } = usePrefixedTranslation('cmps.designer.link.Channel');
  const { fromBalance, toBalance, capacity, status } = link.properties as LinkProperties;

  const channelDetails: DetailValues = [
    { label: l('status'), value: status },
    { label: l('capacity'), value: `${format(capacity)} sats` },
    { label: l('sourceBalance'), value: `${format(fromBalance)} sats` },
    { label: l('destinationBalance'), value: `${format(toBalance)} sats` },
  ];

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
      <DetailsList title={l('sourceTitle')} details={fromDetails} />
      <DetailsList title={l('destinationTitle')} details={toDetails} />
    </SidebarCard>
  );
};

export default Channel;
