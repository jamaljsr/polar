import React, { useCallback } from 'react';
import { QrcodeOutlined } from '@ant-design/icons';
import { Button, Form } from 'antd';
import { usePrefixedTranslation } from 'hooks';
import { TapNode } from 'shared/types';
import { useStoreActions } from 'store';

interface Props {
  node: TapNode;
  type?: 'button' | 'menu';
}

const OpenSendAssetModal: React.FC<Props> = ({ node, type }) => {
  const { l } = usePrefixedTranslation('cmps.designer.tap.actions.NewAddressButton');
  const { showNewAddress } = useStoreActions(s => s.modals);

  const handleClick = useCallback(() => {
    showNewAddress({ nodeName: node.name, networkId: node.networkId });
  }, [node]);

  if (type === 'menu') {
    return (
      <div onClick={handleClick}>
        <QrcodeOutlined />
        <span>{l('newAddress')}</span>
      </div>
    );
  }

  return (
    <Form.Item label={l('title')} colon={false}>
      <Button onClick={handleClick} icon={<QrcodeOutlined />} block>
        {l('newAddress')}
      </Button>
    </Form.Item>
  );
};

export default OpenSendAssetModal;
