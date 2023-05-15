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

const SendAssetButton: React.FC<Props> = ({ node, type }) => {
  const { l } = usePrefixedTranslation('cmps.designer.tap.actions.SendAssetButton');
  const { showSendAsset } = useStoreActions(s => s.modals);

  if (type === 'menu') {
    return (
      <div onClick={() => showSendAsset({ nodeName: node.name })}>
        <QrcodeOutlined />
        <span>{l('send')}</span>
      </div>
    );
  }

  return (
    <Form.Item label={l('title')} colon={false}>
      <Button
        onClick={() => showSendAsset({ nodeName: node.name })}
        icon={<QrcodeOutlined />}
        block
      >
        {l('send')}
      </Button>
    </Form.Item>
  );
};

export default SendAssetButton;
