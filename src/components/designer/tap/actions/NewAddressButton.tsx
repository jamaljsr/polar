import React from 'react';
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

  if (type === 'menu') {
    return (
      <div onClick={() => showNewAddress({ nodeName: node.name })}>
        <QrcodeOutlined />
        <span>{l('newAddress')}</span>
      </div>
    );
  }

  return (
    <Form.Item label={l('title')} colon={false}>
      <Button
        onClick={() => showNewAddress({ nodeName: node.name })}
        icon={<QrcodeOutlined />}
        block
      >
        {l('newAddress')}
      </Button>
    </Form.Item>
  );
};

export default OpenSendAssetModal;
