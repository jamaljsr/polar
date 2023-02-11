import React from 'react';
import { usePrefixedTranslation } from 'hooks';
import { LndNode, Status, TaroNode } from 'shared/types';
import { StatusBadge } from 'components/common';
import DetailsList, { DetailValues } from 'components/common/DetailsList';
import SidebarCard from '../SidebarCard';

interface Props {
  from: TaroNode;
  to: LndNode;
}

const TaroBackend: React.FC<Props> = ({ from, to }) => {
  const { l } = usePrefixedTranslation('cmps.designer.link.TaroBackend');

  const fromDetails: DetailValues = [
    { label: l('name'), value: from.name },
    { label: l('implementation'), value: from.implementation },
    { label: l('version'), value: `v${from.version}` },
    {
      label: l('status'),
      value: <StatusBadge status={from.status} text={Status[from.status]} />,
    },
  ];

  const toDetails: DetailValues = [
    { label: l('name'), value: to.name },
    { label: l('implementation'), value: to.implementation },
    { label: l('version'), value: `v${to.version}` },
    {
      label: l('status'),
      value: <StatusBadge status={to.status} text={Status[to.status]} />,
    },
  ];

  return (
    <SidebarCard title={l('title')}>
      <p>{l('desc')}</p>
      <DetailsList title={l('taroTitle')} details={fromDetails} />
      <DetailsList title={l('lndTitle')} details={toDetails} />
    </SidebarCard>
  );
};

export default TaroBackend;
