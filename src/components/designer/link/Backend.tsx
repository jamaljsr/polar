import React from 'react';
import { BitcoinNode, LightningNode, Status } from 'types';
import { StatusBadge } from 'components/common';
import DetailsList, { DetailValues } from 'components/common/DetailsList';
import SidebarCard from '../SidebarCard';

interface Props {
  bitcoinNode: BitcoinNode;
  lightningNode: LightningNode;
}

const Backend: React.FC<Props> = ({ bitcoinNode, lightningNode }) => {
  const backendDetails: DetailValues = [
    { label: 'Name', value: bitcoinNode.name },
    { label: 'Implementation', value: bitcoinNode.implementation },
    { label: 'Version', value: `v${bitcoinNode.version}` },
    {
      label: 'Status',
      value: (
        <StatusBadge status={bitcoinNode.status} text={Status[bitcoinNode.status]} />
      ),
    },
  ];

  const lightningDetails: DetailValues = [
    { label: 'Name', value: lightningNode.name },
    { label: 'Implementation', value: lightningNode.implementation },
    { label: 'Version', value: `v${lightningNode.version}` },
    {
      label: 'Status',
      value: (
        <StatusBadge status={lightningNode.status} text={Status[lightningNode.status]} />
      ),
    },
  ];

  return (
    <SidebarCard title="Blockchain Backend Connection">
      <DetailsList title="Lightning Node" details={lightningDetails} />
      <DetailsList title="Bitcoin Node" details={backendDetails} />
    </SidebarCard>
  );
};

export default Backend;
