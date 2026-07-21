import React from 'react';
import { usePrefixedTranslation } from 'hooks';
import { ArkNode, BitcoinNode, LightningNode, Status } from 'shared/types';

import { StatusBadge } from 'components/common';
import DetailsList, { DetailValues } from 'components/common/DetailsList';
import SidebarCard from '../SidebarCard';
import ChangeBackendButton from './ChangeBackendButton';

interface Props {
  bitcoinNode: BitcoinNode;
  connectedNode: LightningNode | ArkNode;
}

const Backend: React.FC<Props> = ({ bitcoinNode, connectedNode }) => {
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

  const connectedNodeDetails: DetailValues = [
    { label: l('name'), value: connectedNode.name },
    { label: l('implementation'), value: connectedNode.implementation },
    {
      label: l('version'),
      value: connectedNode.version.startsWith('v')
        ? connectedNode.version
        : `v${connectedNode.version}`,
    },
    {
      label: l('status'),
      value: (
        <StatusBadge status={connectedNode.status} text={Status[connectedNode.status]} />
      ),
    },
  ];

  return (
    <SidebarCard title={l('title')}>
      <p>{l('desc')}</p>
      <DetailsList
        title={connectedNode.type === 'lightning' ? l('lightningTitle') : l('arkTitle')}
        details={connectedNodeDetails}
      />
      <DetailsList title={l('bitcoinTitle')} details={backendDetails} />
      <ChangeBackendButton lnName={connectedNode.name} backendName={bitcoinNode.name} />
    </SidebarCard>
  );
};

export default Backend;
