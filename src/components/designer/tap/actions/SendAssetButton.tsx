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

const SendAssetButton: React.FC<Props> = ({ node, type }) => {
  const { l } = usePrefixedTranslation('cmps.designer.tap.actions.SendAssetButton');
  const { showSendAsset } = useStoreActions(s => s.modals);

  const handleClick = useCallback(() => {
    showSendAsset({ nodeName: node.name, networkId: node.networkId });
  }, [node]);

  if (type === 'menu') {
    return (
      <div onClick={handleClick}>
        <QrcodeOutlined />
        <span>{l('send')}</span>
      </div>
    );
  }

  return (
    <Form.Item label={l('title')} colon={false}>
      <Button onClick={handleClick} icon={<QrcodeOutlined />} block>
        {l('send')}
      </Button>
    </Form.Item>
  );
};

export default SendAssetButton;
