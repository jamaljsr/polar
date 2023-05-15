import React from 'react';
import { WalletOutlined } from '@ant-design/icons';
import { Button, Form } from 'antd';
import { usePrefixedTranslation } from 'hooks';
import { TapNode } from 'shared/types';
import { useStoreActions } from 'store';

interface Props {
  node: TapNode;
  type?: 'button' | 'menu';
}

const MintAssetButton: React.FC<Props> = ({ node, type }) => {
  const { l } = usePrefixedTranslation('cmps.designer.tap.actions.MintAssetButton');
  const { showMintAsset } = useStoreActions(s => s.modals);

  if (type === 'menu') {
    return (
      <div onClick={() => showMintAsset({ nodeName: node.name })}>
        <WalletOutlined />
        <span>{l('mint')}</span>
      </div>
    );
  }
  return (
    <Form.Item label={l('title')} colon={false}>
      <Button
        onClick={() => showMintAsset({ nodeName: node.name })}
        icon={<WalletOutlined />}
        block
      >
        {l('mint')}
      </Button>
    </Form.Item>
  );
};

export default MintAssetButton;
