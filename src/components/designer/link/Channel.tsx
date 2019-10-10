import React from 'react';
import { ILink } from '@mrblenny/react-flow-chart';
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
  const { fromBalance, toBalance, capacity, status } = link.properties as LinkProperties;

  const channelDetails: DetailValues = [
    { label: 'Status', value: status },
    { label: 'Capacity', value: `${format(capacity)} sats` },
    { label: 'Source Balance', value: `${format(fromBalance)} sats` },
    { label: 'Destination Balance', value: `${format(toBalance)} sats` },
  ];

  const [fromDetails, toDetails] = [from, to].map(node => [
    { label: 'Name', value: node.name },
    { label: 'Implementation', value: node.implementation },
    { label: 'Version', value: `v${node.version}` },
    {
      label: 'Status',
      value: <StatusBadge status={node.status} text={Status[node.status]} />,
    },
  ]);

  return (
    <SidebarCard title="Channel Details">
      <DetailsList details={channelDetails} />
      <DetailsList title="Source Node" details={fromDetails} />
      <DetailsList title="Destination Node" details={toDetails} />
    </SidebarCard>
  );
};

export default Channel;
