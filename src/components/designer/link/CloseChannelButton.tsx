import React from 'react';
import { CloseOutlined } from '@ant-design/icons';
import { Button, Modal } from 'antd';
import { usePrefixedTranslation } from 'hooks';
import { LightningNode } from 'shared/types';
import { useStoreActions } from 'store';

interface Props {
  node: LightningNode;
  channelPoint: string;
  type?: 'button' | 'menu';
}

const CloseChannelButton: React.FC<Props> = ({ node, channelPoint, type }) => {
  const { l } = usePrefixedTranslation('cmps.designer.link.CloseChannelButton');
  const { notify } = useStoreActions(s => s.app);
  const { closeChannel } = useStoreActions(s => s.lightning);

  const showCloseChanModal = () => {
    Modal.confirm({
      title: l('title'),
      okText: l('confirmBtn'),
      okType: 'danger',
      cancelText: l('cancelBtn'),
      onOk: async () => {
        try {
          await closeChannel({ node, channelPoint });
          notify({ message: l('success') });
        } catch (error) {
          notify({ message: l('error'), error });
          throw error;
        }
      },
    });
  };

  // render a menu item inside of the NodeContextMenu
  if (type === 'menu') {
    return (
      <span onClick={showCloseChanModal}>
        <CloseOutlined />
        <span>{l('btnText')}</span>
      </span>
    );
  }

  return (
    <Button type="danger" block ghost onClick={showCloseChanModal}>
      {l('btnText')}
    </Button>
  );
};

export default CloseChannelButton;
