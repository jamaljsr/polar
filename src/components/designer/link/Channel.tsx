import React from 'react';
import { ILink } from '@mrblenny/react-flow-chart';
import { Button, Modal } from 'antd';
import { usePrefixedTranslation } from 'hooks';
import { LightningNode, LndNode, Status } from 'shared/types';
import { useStoreActions } from 'store';
import { LinkProperties } from 'utils/chart';
import { ellipseInner } from 'utils/strings';
import { format } from 'utils/units';
import { CopyIcon, DetailsList, StatusBadge } from 'components/common';
import { DetailValues } from 'components/common/DetailsList';
import SidebarCard from '../SidebarCard';

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
  } = link.properties as LinkProperties;

  const { notify } = useStoreActions(s => s.app);
  const { closeChannel } = useStoreActions(s => s.lightning);
  const showCloseChanModal = () => {
    Modal.confirm({
      title: l('closeChanModalTitle'),
      okText: l('closeChanConfirmBtn'),
      okType: 'danger',
      cancelText: l('closeChanCancelBtn'),
      onOk: async () => {
        try {
          await closeChannel({ node: from as LndNode, channelPoint });
          notify({ message: l('closeChanSuccess') });
        } catch (error) {
          notify({ message: l('closeChanError'), error });
          throw error;
        }
      },
    });
  };

  const channelDetails: DetailValues = [
    { label: l('status'), value: status },
    { label: l('capacity'), value: `${format(capacity)} sats` },
    { label: l('sourceBalance'), value: `${format(fromBalance)} sats` },
    { label: l('destinationBalance'), value: `${format(toBalance)} sats` },
    {
      label: l('channelPoint'),
      value: (
        <CopyIcon
          value={channelPoint}
          text={ellipseInner(channelPoint, 4, 6)}
          label={l('channelPoint')}
        />
      ),
    },
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
      {type === 'open-channel' && (
        <Button type="danger" block ghost onClick={showCloseChanModal}>
          {l('closeChanBtn')}
        </Button>
      )}
    </SidebarCard>
  );
};

export default Channel;
