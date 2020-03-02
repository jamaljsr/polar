import React from 'react';
import { usePrefixedTranslation } from 'hooks';
import { BitcoinNode, LightningNode, Status } from 'shared/types';

import { StatusBadge } from 'components/common';
import DetailsList, { DetailValues } from 'components/common/DetailsList';
import SidebarCard from '../SidebarCard';
import ChangeBackendButton from './ChangeBackendButton';

interface Props {
  bitcoinNode: BitcoinNode;
  lightningNode: LightningNode;
}

const Backend: React.FC<Props> = ({ bitcoinNode, lightningNode }) => {
  const { l } = usePrefixedTranslation('cmps.designer.link.Backend');

  const backendDetails: DetailValues = [
    { label: l('name'), value: bitcoinNode.name },
    { label: l('implementation'), value: bitcoinNode.implementation },
    { label: l('version'), value: `v${bitcoinNode.version}` },
    {
      label: l('status'),
      value: (
        <StatusBadge status={bitcoinNode.status} text={Status[bitcoinNode.status]} />
      ),
    },
  ];

  const lightningDetails: DetailValues = [
    { label: l('name'), value: lightningNode.name },
    { label: l('implementation'), value: lightningNode.implementation },
    { label: l('version'), value: `v${lightningNode.version}` },
    {
      label: l('status'),
      value: (
        <StatusBadge status={lightningNode.status} text={Status[lightningNode.status]} />
      ),
    },
  ];

  return (
    <SidebarCard title={l('title')}>
      <p>{l('desc')}</p>
      <DetailsList title={l('lightningTitle')} details={lightningDetails} />
      <DetailsList title={l('bitcoinTitle')} details={backendDetails} />
      <ChangeBackendButton lnName={lightningNode.name} backendName={bitcoinNode.name} />
    </SidebarCard>
  );
};

export default Backend;
