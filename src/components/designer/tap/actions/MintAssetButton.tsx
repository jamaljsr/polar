import React, { useCallback } from 'react';
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

  const handleClick = useCallback(() => {
    showMintAsset({ nodeName: node.name, networkId: node.networkId });
  }, [node]);

  if (type === 'menu') {
    return (
      <div onClick={handleClick}>
        <WalletOutlined />
        <span>{l('mint')}</span>
      </div>
    );
  }
  return (
    <Form.Item label={l('title')} colon={false}>
      <Button onClick={handleClick} icon={<WalletOutlined />} block>
        {l('mint')}
      </Button>
    </Form.Item>
  );
};

export default MintAssetButton;
